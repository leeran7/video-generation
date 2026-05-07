import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { characters, jobs } from "@/lib/db/schema";
import { inngest } from "@/lib/inngest/client";
import { getShowAccess } from "@/lib/auth/show-access";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ showSlug: string; charSlug: string }> }
) {
  // TODO: remove before shipping
  void req;
  void params;
  return NextResponse.json({ error: "Image generation not yet enabled." }, { status: 503 });
}

export async function _POST_REAL(
  req: Request,
  { params }: { params: Promise<{ showSlug: string; charSlug: string }> }
) {
  const { showSlug, charSlug } = await params;

  const access = await getShowAccess(showSlug);
  if (!access) {
    return NextResponse.json({ error: "Show not found" }, { status: 404 });
  }
  if (!access.canEdit) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let prompt: string;
  try {
    const body = (await req.json()) as { prompt?: unknown };
    if (typeof body?.prompt !== "string" || !body.prompt.trim()) {
      return NextResponse.json(
        { error: "prompt must be a non-empty string" },
        { status: 400 }
      );
    }
    prompt = body.prompt.trim();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Read the show's art style from seriesBible
  const bible = access.show.seriesBible as Record<string, unknown> | null;
  const styleId = typeof bible?.designStyleId === "string" ? bible.designStyleId : "animated-series";

  const [char] = await db
    .select({ id: characters.id, slug: characters.slug, type: characters.type })
    .from(characters)
    .where(
      and(eq(characters.showId, access.show.id), eq(characters.slug, charSlug))
    )
    .limit(1);

  if (!char) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  const category = char.type === "antagonist" ? "antagonist" : "hero";

  const [job] = await db
    .insert(jobs)
    .values({ type: "image.generate", status: "pending" })
    .returning({ id: jobs.id });

  try {
    await inngest.send({
      name: "image/generate.requested",
      data: {
        jobId: job.id,
        characterId: char.id,
        showId: access.show.id,
        slug: char.slug,
        category,
        prompt,
        styleId,
      },
    });
  } catch (err) {
    const msg = (err as Error).message ?? "unknown";
    await db
      .update(jobs)
      .set({ status: "failed", error: `inngest.send failed: ${msg}` })
      .where(eq(jobs.id, job.id));
    return NextResponse.json(
      { error: `Failed to enqueue: ${msg}`, jobId: job.id },
      { status: 502 }
    );
  }

  return NextResponse.json({ jobId: job.id });
}
