import { and, eq, lt, or, sql } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { jobs } from "@/lib/db/schema";

const PENDING_STALE_MS = 2 * 60 * 1000;
const RUNNING_STALE_MS = 30 * 60 * 1000;

/**
 * Sweep abandoned jobs:
 *   - `pending` for >2 min  → never picked up by a worker (Inngest down)
 *   - `running` for >30 min → worker crashed without firing onFailure
 *
 * Flip them to `expired` so the UI stops polling them.
 */
export async function expireStalePendingJobs(opts?: {
  episodeId?: string;
}): Promise<number> {
  const now = Date.now();
  const pendingCutoff = new Date(now - PENDING_STALE_MS);
  const runningCutoff = new Date(now - RUNNING_STALE_MS);

  const staleness = or(
    and(eq(jobs.status, "pending"), lt(jobs.createdAt, pendingCutoff)),
    and(eq(jobs.status, "running"), lt(jobs.startedAt, runningCutoff))
  );

  const conds = opts?.episodeId
    ? and(staleness, eq(jobs.episodeId, opts.episodeId))
    : staleness;

  const updated = await db
    .update(jobs)
    .set({
      status: "expired",
      error: sql`COALESCE(${jobs.error}, 'Worker did not finish — Inngest may have been down or crashed')`,
      completedAt: sql`now()`,
    })
    .where(conds)
    .returning({ id: jobs.id });

  return updated.length;
}
