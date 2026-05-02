import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { episodes, jobs, scenes } from "@/lib/db/schema";
import { expireStalePendingJobs } from "@/lib/inngest/cleanup";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await expireStalePendingJobs();

  const [job] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

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

  return NextResponse.json({
    job: {
      id: job.id,
      type: job.type,
      status: job.status,
      progress: job.progress,
      result: job.result,
      error: job.error,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
    },
    scenes: sceneRows,
    masterVideoPath,
  });
}
