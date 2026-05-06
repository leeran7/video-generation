import OpenAI from "openai";
import type { ImagesResponse } from "openai/resources/images";
import { and, eq, isNotNull, ne, sql } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { characters, jobs } from "@/lib/db/schema";
import { inngest } from "@/lib/inngest/client";
import {
  ensureImageBucket,
  getImageStorageClient,
  loadStyleRefs,
  uploadImage,
} from "@/lib/inngest/image-storage";

export const generateImage = inngest.createFunction(
  {
    id: "generate-image",
    retries: 1,
    triggers: [{ event: "image/generate.requested" }],
    onFailure: async ({ event, error }) => {
      const original = (event.data as { event?: { data?: unknown } }).event;
      const { jobId } = ((original?.data ?? {}) as { jobId?: string });
      const message = (error as Error)?.message ?? String(error);
      if (jobId) {
        await db
          .update(jobs)
          .set({ status: "failed", error: message, completedAt: sql`now()` })
          .where(eq(jobs.id, jobId));
      }
    },
  },
  async ({ event, step }) => {
    const { jobId, characterId, showId, slug, category, prompt } = event.data as {
      jobId: string;
      characterId: string;
      showId: string;
      slug: string;
      category: "hero" | "antagonist";
      prompt: string;
    };

    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY not set — cannot generate images.");
    }

    await step.run("mark-running", async () => {
      await db
        .update(jobs)
        .set({ status: "running", startedAt: sql`now()` })
        .where(eq(jobs.id, jobId));
    });

    const imageUrl = await step.run("generate-and-upload", async () => {
      const openai = new OpenAI();
      const supabase = getImageStorageClient();
      await ensureImageBucket(supabase);

      // Use other characters in the same show that already have design sheets
      // as style references so the output stays visually consistent.
      const existingDesigns = await db
        .select({ designSheet: characters.designSheet })
        .from(characters)
        .where(
          and(
            eq(characters.showId, showId),
            isNotNull(characters.designSheet),
            ne(characters.id, characterId)
          )
        )
        .limit(5);

      const styleRefUrls = existingDesigns
        .map((r) => r.designSheet)
        .filter((u): u is string => !!u);

      const styleRefs = await loadStyleRefs(styleRefUrls);

      let b64: string | undefined;

      if (styleRefs.length > 0) {
        const styledPrompt = `Match the exact art style of the provided reference images. Use the same linework, proportions, rendering, and color treatment. ${prompt}`;
        const result = (await openai.images.edit({
          model: "gpt-image-1",
          image: styleRefs,
          prompt: styledPrompt,
          n: 1,
          size: "1536x1024",
          quality: "high",
        } as Parameters<typeof openai.images.edit>[0])) as ImagesResponse;
        b64 = result.data?.[0]?.b64_json;
      } else {
        const result = (await openai.images.generate({
          model: "gpt-image-1",
          prompt,
          n: 1,
          size: "1536x1024",
          quality: "high",
        } as Parameters<typeof openai.images.generate>[0])) as ImagesResponse;
        b64 = result.data?.[0]?.b64_json;
      }

      if (!b64) throw new Error("OpenAI returned no image data");

      const buffer = Buffer.from(b64, "base64");
      const objectPath = `${category}/${slug}.png`;
      const publicUrl = await uploadImage(supabase, objectPath, buffer);

      // Update both the designSheet column and data.imageUrl so the UI
      // immediately shows the new image without a full re-seed.
      const [existing] = await db
        .select({ data: characters.data })
        .from(characters)
        .where(eq(characters.id, characterId))
        .limit(1);

      const updatedData = existing
        ? { ...existing.data, imageUrl: publicUrl }
        : undefined;

      await db
        .update(characters)
        .set({
          designSheet: publicUrl,
          ...(updatedData ? { data: updatedData } : {}),
          updatedAt: sql`now()`,
        })
        .where(eq(characters.id, characterId));

      return publicUrl;
    });

    await step.run("mark-complete", async () => {
      await db
        .update(jobs)
        .set({
          status: "complete",
          completedAt: sql`now()`,
          result: { imageUrl },
        })
        .where(eq(jobs.id, jobId));
    });

    return { jobId, characterId, imageUrl };
  }
);
