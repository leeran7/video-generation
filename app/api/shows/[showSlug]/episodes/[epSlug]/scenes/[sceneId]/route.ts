import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { episodes, scenes } from "@/lib/db/schema";
import { getShowAccess } from "@/lib/auth/show-access";
import { toUserFacingError } from "@/lib/ai/error";

type Patch = {
  title?: string | null;
  durationSeconds?: number | null;
  generationPrompt?: string | null;
};

export async function PATCH(
  req: Request,
  {
    params,
  }: {
    params: Promise<{
      showSlug: string;
      epSlug: string;
      sceneId: string;
    }>;
  }
) {
  try {
    const { showSlug, epSlug, sceneId } = await params;

    const access = await getShowAccess(showSlug);
    if (!access) {
      return NextResponse.json({ error: "Show not found" }, { status: 404 });
    }
    if (!access.canEdit) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let patch: Patch;
    try {
      patch = (await req.json()) as Patch;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const [scene] = await db
      .select({ id: scenes.id })
      .from(scenes)
      .innerJoin(episodes, eq(scenes.episodeId, episodes.id))
      .where(
        and(
          eq(scenes.id, sceneId),
          eq(episodes.slug, epSlug),
          eq(episodes.showId, access.show.id)
        )
      )
      .limit(1);
    if (!scene) {
      return NextResponse.json({ error: "Scene not found" }, { status: 404 });
    }

    const update: Record<string, unknown> = { updatedAt: sql`now()` };

    if (patch.title !== undefined) {
      update.title =
        typeof patch.title === "string" ? patch.title.trim() || null : null;
    }
    if (patch.durationSeconds !== undefined) {
      if (patch.durationSeconds === null) {
        update.durationSeconds = null;
      } else if (
        typeof patch.durationSeconds === "number" &&
        Number.isFinite(patch.durationSeconds) &&
        patch.durationSeconds >= 0
      ) {
        update.durationSeconds = Math.round(patch.durationSeconds);
      } else {
        return NextResponse.json(
          { error: "durationSeconds must be a non-negative number or null" },
          { status: 400 }
        );
      }
    }
    if (patch.generationPrompt !== undefined) {
      update.generationPrompt =
        typeof patch.generationPrompt === "string"
          ? patch.generationPrompt.trim() || null
          : null;
    }

    await db.update(scenes).set(update).where(eq(scenes.id, scene.id));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PATCH .../scenes/[sceneId]]", err);
    return NextResponse.json({ error: toUserFacingError(err) }, { status: 500 });
  }
}
