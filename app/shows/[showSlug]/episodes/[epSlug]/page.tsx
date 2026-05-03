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

  return (
    <main>
      <Link href={`/shows/${showSlug}/episodes`} className="back-link">
        ← Episodes
      </Link>

      <div className="detail">
        <div className="detail-bar" />
        <div className="detail-header">
          <div className="detail-eyebrow">
            {arc ? `Arc ${arc.arcNumber} · ${arc.title}` : "No arc"} ·{" "}
            Ep {String(ep.episodeNumber).padStart(2, "0")}
          </div>
          <h2 className="detail-name">{ep.title}</h2>
          <p className="detail-alias">
            {ep.runtimeSeconds
              ? `${Math.round(ep.runtimeSeconds / 60)} min`
              : "Runtime —"}
            {ep.lockStatus ? ` · ${ep.lockStatus}` : ""}
            {focus?.name ? ` · Focus: ${focus.name}` : ""}
          </p>
          {ep.masterVideoPath && (
            <div className="detail-actions">
              <a
                className="render-master-link"
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
          <section className="detail-section">
            <div className="section-label">Hook</div>
            <p className="section-content">{ep.brief}</p>
          </section>
        )}

        {ep.tags && ep.tags.length > 0 && (
          <section className="detail-section">
            <div className="section-label">Tags</div>
            <div className="traits-list">
              {ep.tags.map((tag) => (
                <span key={tag} className="trait-tag">
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

        <section className="detail-section">
          <div className="section-label">Script</div>
          {scriptHtml ? (
            <details className="script-disclosure">
              <summary>View script</summary>
              <div
                className="script-md"
                dangerouslySetInnerHTML={{ __html: scriptHtml }}
              />
            </details>
          ) : (
            <p className="placeholder-text">No script content seeded.</p>
          )}
        </section>
      </div>
    </main>
  );
}
