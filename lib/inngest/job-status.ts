import { asc, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { episodes, jobs, scenes } from "@/lib/db/schema";
import { expireStalePendingJobs } from "@/lib/inngest/cleanup";

const TERMINAL_STATUSES = new Set(["complete", "failed", "error", "expired"]);

export type SceneStatus = {
  id: string;
  sceneNumber: number;
  sceneId: string | null;
  title: string | null;
  status: string | null;
  videoPath: string | null;
  error: string | null;
};

export type JobStatusJob = {
  id: string;
  type: string;
  status: string | null;
  episodeId: string | null;
  progress: Record<string, unknown> | null;
  result: Record<string, unknown> | null;
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
};

export type JobStatusResponse = {
  job: JobStatusJob;
  scenes: SceneStatus[];
  masterVideoPath: string | null;
};

/**
 * Fetch the current state of a render job + its scenes + the episode's
 * master video path. Used by both the API polling endpoint and the page
 * server-side hydrator. Sweeps stale jobs first — but only when the
 * target job isn't already terminal, so the 2s console poll doesn't
 * generate redundant cleanup queries on finished jobs.
 */
export async function getJobStatus(
  jobId: string
): Promise<JobStatusResponse | null> {
  const [initial] = await db
    .select({ status: jobs.status })
    .from(jobs)
    .where(eq(jobs.id, jobId))
    .limit(1);
  if (!initial) return null;

  const wasTerminal = TERMINAL_STATUSES.has(initial.status ?? "");
  if (!wasTerminal) await expireStalePendingJobs();

  const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
  if (!job) return null;

  const sceneRows = job.episodeId
    ? await db
        .select({
          id: scenes.id,
          sceneNumber: scenes.sceneNumber,
          sceneId: scenes.sceneId,
          title: scenes.title,
          status: scenes.status,
          videoPath: scenes.videoPath,
          error: scenes.error,
        })
        .from(scenes)
        .where(eq(scenes.episodeId, job.episodeId))
        .orderBy(asc(scenes.sceneNumber))
    : [];

  const masterVideoPath = job.episodeId
    ? (
        await db
          .select({ masterVideoPath: episodes.masterVideoPath })
          .from(episodes)
          .where(eq(episodes.id, job.episodeId))
          .limit(1)
      )[0]?.masterVideoPath ?? null
    : null;

  return {
    job: {
      id: job.id,
      type: job.type,
      status: job.status,
      episodeId: job.episodeId,
      progress: job.progress,
      result: job.result,
      error: job.error,
      startedAt: job.startedAt ? job.startedAt.toISOString() : null,
      completedAt: job.completedAt ? job.completedAt.toISOString() : null,
    },
    scenes: sceneRows,
    masterVideoPath,
  };
}
