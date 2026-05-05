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

  if (manifest.scenes.length === 0) {
    return [];
  }

  const values = manifest.scenes.map((scene) => {
    const gen = scene.generation ?? {};
    return {
      episodeId: episode.id,
      sceneNumber: scene.order,
      sceneId: scene.id,
      title: scene.title ?? null,
      durationSeconds: gen.targetDurationSeconds ?? null,
      generationPrompt: gen.prompt ?? gen.promptSummary ?? null,
      imageRef: gen.imageRef ?? null,
      status: "pending" as const,
    };
  });

  const rows = await db
    .insert(scenes)
    .values(values)
    .onConflictDoUpdate({
      target: [scenes.episodeId, scenes.sceneNumber],
      set: {
        sceneId: sql`excluded.scene_id`,
        title: sql`excluded.title`,
        durationSeconds: sql`excluded.duration_seconds`,
        generationPrompt: sql`excluded.generation_prompt`,
        imageRef: sql`excluded.image_ref`,
        updatedAt: sql`now()`,
      },
    })
    .returning();

  return rows.map<SyncedSceneRow>((row, idx) => ({
    id: row.id,
    sceneNumber: row.sceneNumber,
    sceneId: row.sceneId ?? manifest.scenes[idx]?.id ?? "",
    title: row.title,
    durationSeconds: row.durationSeconds,
    generationPrompt: row.generationPrompt,
    videoPath: row.videoPath,
    status: row.status,
  }));
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
