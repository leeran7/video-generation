import { sql } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { scenes } from "@/lib/db/schema";
import { parseScriptToManifest } from "@/packages/pipeline/manifest";

/**
 * Idempotently creates/updates `scenes` rows from the episode script manifest.
 * Does not enqueue rendering or change scene status for existing rows (besides
 * what onConflictDoUpdate touches — metadata only).
 */
export async function syncScenesFromScript(episode: {
  id: string;
  slug: string;
  scriptContent: string | null;
}) {
  if (!episode.scriptContent) {
    return [];
  }

  const { manifest } = parseScriptToManifest(episode.scriptContent, {
    slug: episode.slug,
  });

  const inserted: SyncedSceneRow[] = [];

  for (const scene of manifest.scenes) {
    const gen = scene.generation ?? {};
    const [row] = await db
      .insert(scenes)
      .values({
        episodeId: episode.id,
        sceneNumber: scene.order,
        sceneId: scene.id,
        title: scene.title ?? null,
        durationSeconds: gen.targetDurationSeconds ?? null,
        generationPrompt: gen.prompt ?? gen.promptSummary ?? null,
        imageRef: gen.imageRef ?? null,
        status: "pending",
      })
      .onConflictDoUpdate({
        target: [scenes.episodeId, scenes.sceneNumber],
        set: {
          sceneId: scene.id,
          title: scene.title ?? null,
          durationSeconds: gen.targetDurationSeconds ?? null,
          generationPrompt: gen.prompt ?? gen.promptSummary ?? null,
          imageRef: gen.imageRef ?? null,
          updatedAt: sql`now()`,
        },
      })
      .returning();

    inserted.push({
      id: row.id,
      sceneNumber: row.sceneNumber,
      sceneId: row.sceneId ?? scene.id,
      title: row.title,
      durationSeconds: row.durationSeconds,
      generationPrompt: row.generationPrompt,
      videoPath: row.videoPath,
      status: row.status,
    });
  }

  return inserted;
}

type SyncedSceneRow = {
  id: string;
  sceneNumber: number;
  sceneId: string;
  title: string | null;
  durationSeconds: number | null;
  generationPrompt: string | null;
  videoPath: string | null;
  status: string | null;
};
