import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, desc, eq } from "drizzle-orm";
import { marked } from "marked";
import { db } from "@/lib/db/client";
import {
  arcs,
  characters,
  episodes,
  jobs,
  scenes,
  shows,
} from "@/lib/db/schema";
import { syncScenesFromScript } from "@/lib/episodes/sync-scenes-from-script";
import { getJobStatus } from "@/lib/inngest/job-status";
import { RenderPanel } from "./render-panel";

marked.setOptions({ gfm: true, breaks: false });

export default async function EpisodeDetailPage({
  params,
}: {
  params: Promise<{ showSlug: string; epSlug: string }>;
}) {
  const { showSlug, epSlug } = await params;

  const [show] = await db
    .select()
    .from(shows)
    .where(eq(shows.slug, showSlug))
    .limit(1);

  if (!show) notFound();

  const [ep] = await db
    .select()
    .from(episodes)
    .where(and(eq(episodes.showId, show.id), eq(episodes.slug, epSlug)))
    .limit(1);

  if (!ep) notFound();

  try {
    await syncScenesFromScript({
      id: ep.id,
      slug: ep.slug,
      scriptContent: ep.scriptContent,
    });
  } catch (err) {
    console.error(
      `[episodes/${epSlug}] sync-scenes-from-script:`,
      err instanceof Error ? err.message : err
    );
  }

  const [arc, focus, latestJob] = await Promise.all([
    ep.arcId
      ? db
          .select()
          .from(arcs)
          .where(eq(arcs.id, ep.arcId))
          .limit(1)
          .then((r) => r[0] ?? null)
      : Promise.resolve(null),
    ep.focusCharacterId
      ? db
          .select()
          .from(characters)
          .where(eq(characters.id, ep.focusCharacterId))
          .limit(1)
          .then((r) => r[0] ?? null)
      : Promise.resolve(null),
    db
      .select({ id: jobs.id })
      .from(jobs)
      .where(eq(jobs.episodeId, ep.id))
      .orderBy(desc(jobs.createdAt))
      .limit(1)
      .then((r) => r[0] ?? null),
  ]);

  const jobStatus = latestJob ? await getJobStatus(latestJob.id) : null;
  const sceneRows = jobStatus
    ? jobStatus.scenes
    : await db
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
        .where(eq(scenes.episodeId, ep.id))
        .orderBy(asc(scenes.sceneNumber));

  const scriptHtml = ep.scriptContent
    ? await marked.parse(ep.scriptContent)
    : null;

  const sectionClass =
    "border-b border-(--border) px-7 py-5 last:border-b-0";
  const sectionLabelClass =
    "mb-1.5 border-b border-(--border) pb-1 text-[10px] uppercase tracking-[0.2em] text-(--muted)";

  return (
    <main className="mx-auto max-w-[1400px] px-6 pb-20 pt-10">
      <Link
        href={`/shows/${showSlug}/episodes`}
        className="mb-6 inline-block text-xs uppercase tracking-[0.15em] text-(--muted) no-underline transition-colors hover:text-(--text)"
      >
        ← Episodes
      </Link>

      <div className="overflow-hidden rounded border border-(--border) bg-(--panel)">
        <div className="h-1 bg-[var(--accent,var(--text))]" />
        <div className="flex flex-col justify-center px-7 pb-6 pt-7">
          <div className="mb-2 text-[11px] uppercase tracking-[0.2em] text-(--muted)">
            {arc ? `Arc ${arc.arcNumber} · ${arc.title}` : "No arc"} ·{" "}
            Ep {String(ep.episodeNumber).padStart(2, "0")}
          </div>
          <h2 className="m-0 mb-2 text-[clamp(28px,4vw,40px)] font-extrabold tracking-[-0.01em] text-[var(--accent,var(--text))]">
            {ep.title}
          </h2>
          <p className="m-0 text-[13px] uppercase tracking-[0.15em] text-(--muted)">
            {ep.runtimeSeconds
              ? `${Math.round(ep.runtimeSeconds / 60)} min`
              : "Runtime —"}
            {ep.lockStatus ? ` · ${ep.lockStatus}` : ""}
            {focus?.name ? ` · Focus: ${focus.name}` : ""}
          </p>
          {ep.masterVideoPath && (
            <div className="mt-3.5 flex flex-wrap items-center gap-3.5">
              <a
                className="border-b border-dashed border-(--muted) pb-px text-xs uppercase tracking-[0.16em] text-(--muted) no-underline transition-colors hover:border-(--text) hover:text-(--text)"
                href={ep.masterVideoPath}
                target="_blank"
                rel="noreferrer"
              >
                Open master video ↗
              </a>
            </div>
          )}
        </div>

        {ep.brief && (
          <section className={sectionClass}>
            <div className={sectionLabelClass}>Hook</div>
            <p className="m-0 text-sm leading-[1.6] text-(--text)">
              {ep.brief}
            </p>
          </section>
        )}

        {ep.tags && ep.tags.length > 0 && (
          <section className={sectionClass}>
            <div className={sectionLabelClass}>Tags</div>
            <div className="flex flex-wrap gap-1.5">
              {ep.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-[2px] border border-[color-mix(in_srgb,var(--accent,var(--text))_30%,transparent)] bg-[color-mix(in_srgb,var(--accent,var(--text))_12%,transparent)] px-2.5 py-[3px] text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--accent,var(--text))]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </section>
        )}

        <RenderPanel
          key={jobStatus?.job.id ?? "no-job"}
          showSlug={showSlug}
          epSlug={epSlug}
          hasScript={!!ep.scriptContent}
          initialJob={jobStatus}
          initialScenes={sceneRows}
        />

        <section className={sectionClass}>
          <div className="mb-1.5 flex items-center justify-between border-b border-(--border) pb-1">
            <div className="text-[10px] uppercase tracking-[0.2em] text-(--muted)">
              Script
            </div>
            <Link
              href={`/shows/${showSlug}/episodes/${epSlug}/script`}
              className="text-[10px] font-bold uppercase tracking-[0.2em] text-(--muted) no-underline transition-colors hover:text-(--text)"
            >
              Edit ↗
            </Link>
          </div>
          {scriptHtml ? (
            <details className="script-disclosure mt-1">
              <summary>View script</summary>
              <div
                className="script-md"
                dangerouslySetInnerHTML={{ __html: scriptHtml }}
              />
            </details>
          ) : (
            <p className="text-[13px] uppercase tracking-[0.1em] text-(--muted)">
              No script content seeded.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
