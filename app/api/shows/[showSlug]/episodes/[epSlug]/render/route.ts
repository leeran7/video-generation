import { NextResponse } from "next/server";
import { and, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { episodes, jobs, scenes } from "@/lib/db/schema";
import { inngest } from "@/lib/inngest/client";
import { expireStalePendingJobs } from "@/lib/inngest/cleanup";
import { getShowAccess } from "@/lib/auth/show-access";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ showSlug: string; epSlug: string }> }
) {
  const { showSlug, epSlug } = await params;

  const access = await getShowAccess(showSlug);
  if (!access) {
    return NextResponse.json({ error: "Show not found" }, { status: 404 });
  }
  if (!access.canEdit) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let sceneIds: string[] = [];
  try {
    const body = (await req.json()) as { sceneIds?: unknown };
    if (Array.isArray(body?.sceneIds)) {
      sceneIds = body.sceneIds.filter(
        (x): x is string => typeof x === "string" && x.length > 0
      );
    }
  } catch {
    // No body / invalid JSON — treat as full re-run.
  }

  const [ep] = await db
    .select({ id: episodes.id, scriptContent: episodes.scriptContent })
    .from(episodes)
    .where(
      and(eq(episodes.showId, access.show.id), eq(episodes.slug, epSlug))
    )
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

  // Selective retry: reset chosen scenes so the per-scene idempotency check
  // (`status === 'complete' && videoPath`) sees them as not-done and re-runs
  // generation. Scenes not in the list are left alone — already-completed
  // ones get skipped, anything else gets retried.
  if (sceneIds.length > 0) {
    const owned = await db
      .select({ id: scenes.id })
      .from(scenes)
      .where(and(eq(scenes.episodeId, ep.id), inArray(scenes.id, sceneIds)));
    if (owned.length !== sceneIds.length) {
      const ownedSet = new Set(owned.map((r) => r.id));
      const stray = sceneIds.filter((id) => !ownedSet.has(id));
      return NextResponse.json(
        {
          error: `sceneIds do not belong to this episode: ${stray.join(", ")}`,
        },
        { status: 400 }
      );
    }
    await db
      .update(scenes)
      .set({
        status: "pending",
        error: null,
        videoPath: null,
        updatedAt: sql`now()`,
      })
      .where(and(eq(scenes.episodeId, ep.id), inArray(scenes.id, sceneIds)));
  }

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
      data: {
        jobId: job.id,
        episodeId: ep.id,
        ...(sceneIds.length > 0 ? { sceneIds } : {}),
      },
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
