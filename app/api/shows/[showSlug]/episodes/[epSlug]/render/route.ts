import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { episodes, jobs, shows } from "@/lib/db/schema";
import { inngest } from "@/lib/inngest/client";
import { expireStalePendingJobs } from "@/lib/inngest/cleanup";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ showSlug: string; epSlug: string }> }
) {
  const { showSlug, epSlug } = await params;

  const [show] = await db
    .select({ id: shows.id })
    .from(shows)
    .where(eq(shows.slug, showSlug))
    .limit(1);
  if (!show) {
    return NextResponse.json({ error: "Show not found" }, { status: 404 });
  }

  const [ep] = await db
    .select({ id: episodes.id, scriptContent: episodes.scriptContent })
    .from(episodes)
    .where(and(eq(episodes.showId, show.id), eq(episodes.slug, epSlug)))
    .limit(1);
  if (!ep) {
    return NextResponse.json({ error: "Episode not found" }, { status: 404 });
  }
  if (!ep.scriptContent) {
    return NextResponse.json(
      { error: "Episode has no scriptContent — cannot render." },
      { status: 400 }
    );
  }

  await expireStalePendingJobs({ episodeId: ep.id });

  const [job] = await db
    .insert(jobs)
    .values({
      type: "episode.render",
      status: "pending",
      episodeId: ep.id,
    })
    .returning({ id: jobs.id });

  try {
    await inngest.send({
      name: "episode/render.requested",
      data: { jobId: job.id, episodeId: ep.id },
    });
  } catch (err) {
    const msg = (err as Error).message ?? "unknown";
    await db
      .update(jobs)
      .set({ status: "failed", error: `inngest.send failed: ${msg}` })
      .where(eq(jobs.id, job.id));
    return NextResponse.json(
      {
        error: `Failed to enqueue Inngest event: ${msg}. Is the Inngest dev server running and INNGEST_EVENT_KEY/INNGEST_BASE_URL set if needed?`,
        jobId: job.id,
      },
      { status: 502 }
    );
  }

  return NextResponse.json({ jobId: job.id });
}
