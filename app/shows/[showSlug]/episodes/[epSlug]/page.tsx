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
} from "@/lib/db/schema";
import { getJobStatus } from "@/lib/inngest/job-status";
import { getShowAccess } from "@/lib/auth/show-access";
import { MetadataEditor } from "./metadata-editor";
import { RenderPanel } from "./render-panel";

marked.setOptions({ gfm: true, breaks: false });

export default async function EpisodeDetailPage({
  params,
}: {
  params: Promise<{ showSlug: string; epSlug: string }>;
}) {
  const { showSlug, epSlug } = await params;

  const access = await getShowAccess(showSlug);
  if (!access) notFound();
  const showId = access.show.id;
  const canEdit = access.canEdit;

  const [ep] = await db
    .select()
    .from(episodes)
    .where(and(eq(episodes.showId, showId), eq(episodes.slug, epSlug)))
    .limit(1);

  if (!ep) notFound();

  const [arc, focus, latestJob, charOptions] = await Promise.all([
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
    db
      .select({ slug: characters.slug, name: characters.name })
      .from(characters)
      .where(eq(characters.showId, showId))
      .orderBy(asc(characters.rosterNumber))
      .then((rows) =>
        rows
          .filter((r): r is { slug: string; name: string } => !!r.name)
          .map((r) => ({ slug: r.slug, name: r.name }))
      ),
  ]);

  const [jobStatus, scriptHtml] = await Promise.all([
    latestJob ? getJobStatus(latestJob.id) : Promise.resolve(null),
    ep.scriptContent ? marked.parse(ep.scriptContent) : Promise.resolve(null),
  ]);
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

        <section className={sectionClass}>
          <div className="mb-1.5 flex items-center justify-between border-b border-(--border) pb-1">
            <div className="text-[10px] uppercase tracking-[0.2em] text-(--muted)">
              Metadata
            </div>
          </div>
          {ep.brief && (
            <p className="m-0 mb-3 text-sm leading-[1.6] text-(--text)">
              {ep.brief}
            </p>
          )}
          {ep.tags && ep.tags.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {ep.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-[2px] border border-[color-mix(in_srgb,var(--accent,var(--text))_30%,transparent)] bg-[color-mix(in_srgb,var(--accent,var(--text))_12%,transparent)] px-2.5 py-[3px] text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--accent,var(--text))]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          {canEdit && (
            <MetadataEditor
              showSlug={showSlug}
              epSlug={epSlug}
              initialTitle={ep.title}
              initialBrief={ep.brief ?? ""}
              initialTags={ep.tags ?? []}
              initialFocusCharacterSlug={focus?.slug ?? ""}
              initialLockStatus={ep.lockStatus ?? "draft"}
              characterOptions={charOptions}
            />
          )}
        </section>

        {canEdit && (
          <RenderPanel
            key={jobStatus?.job.id ?? "no-job"}
            showSlug={showSlug}
            epSlug={epSlug}
            hasScript={!!ep.scriptContent}
            initialJob={jobStatus}
            initialScenes={sceneRows}
          />
        )}

        <section className={sectionClass}>
          <div className="mb-1.5 flex items-center justify-between border-b border-(--border) pb-1">
            <div className="text-[10px] uppercase tracking-[0.2em] text-(--muted)">
              Script
            </div>
            {canEdit && (
              <Link
                href={`/shows/${showSlug}/episodes/${epSlug}/script`}
                className="text-[10px] font-bold uppercase tracking-[0.2em] text-(--muted) no-underline transition-colors hover:text-(--text)"
              >
                Edit ↗
              </Link>
            )}
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
