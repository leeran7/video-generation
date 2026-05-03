import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { arcs, episodes, scenes, shows } from "@/lib/db/schema";
import { syncScenesFromScript } from "@/lib/episodes/sync-scenes-from-script";

export default async function EpisodesPage({
  params,
}: {
  params: Promise<{ showSlug: string }>;
}) {
  const { showSlug } = await params;

  const [show] = await db
    .select()
    .from(shows)
    .where(eq(shows.slug, showSlug))
    .limit(1);

  if (!show) notFound();

  const arcRows = await db
    .select()
    .from(arcs)
    .where(eq(arcs.showId, show.id))
    .orderBy(asc(arcs.season), asc(arcs.arcNumber));

  const epRows = await db
    .select()
    .from(episodes)
    .where(eq(episodes.showId, show.id))
    .orderBy(asc(episodes.episodeNumber));

  await Promise.all(
    epRows.map((ep) =>
      syncScenesFromScript({
        id: ep.id,
        slug: ep.slug,
        scriptContent: ep.scriptContent,
      }).catch((err) => {
        console.error(
          `[episodes list ${ep.slug}] sync-scenes-from-script:`,
          err instanceof Error ? err.message : err
        );
      })
    )
  );

  const sceneAggRows = await db
    .select({
      episodeId: scenes.episodeId,
      total: sql<number>`count(*)::int`,
      complete: sql<number>`count(*) filter (where ${scenes.status} = 'complete')::int`,
      failed: sql<number>`count(*) filter (where ${scenes.status} = 'failed')::int`,
    })
    .from(scenes)
    .innerJoin(episodes, eq(scenes.episodeId, episodes.id))
    .where(eq(episodes.showId, show.id))
    .groupBy(scenes.episodeId);

  const sceneAgg = new Map(
    sceneAggRows
      .filter(
        (r): r is typeof r & { episodeId: string } => r.episodeId != null
      )
      .map((r) => [r.episodeId, r])
  );

  function renderBadge(epId: string, hasMaster: boolean) {
    const agg = sceneAgg.get(epId);
    if (hasMaster) {
      return <span className="ep-badge ep-badge-rendered">rendered</span>;
    }
    if (!agg) return null;
    if (agg.failed > 0) {
      return (
        <span className="ep-badge ep-badge-failed">
          {agg.complete}/{agg.total} · {agg.failed} failed
        </span>
      );
    }
    if (agg.complete < agg.total) {
      return (
        <span className="ep-badge ep-badge-partial">
          {agg.complete}/{agg.total}
        </span>
      );
    }
    return null;
  }

  const byArc = new Map<string | null, typeof epRows>();
  for (const ep of epRows) {
    const key = ep.arcId ?? null;
    const list = byArc.get(key) ?? [];
    list.push(ep);
    byArc.set(key, list);
  }

  const arcsWithEpisodes = arcRows.filter((arc) => byArc.has(arc.id));
  const orphanEpisodes = byArc.get(null) ?? [];

  return (
    <main>
      <h1>Episodes</h1>
      <p className="show-meta">
        {epRows.length} episode{epRows.length === 1 ? "" : "s"} ·{" "}
        {arcsWithEpisodes.length} arc{arcsWithEpisodes.length === 1 ? "" : "s"}
      </p>

      {arcsWithEpisodes.map((arc) => {
        const list = byArc.get(arc.id)!;
        return (
          <section key={arc.id} className="arc-section">
            <header className="arc-section-head">
              <span className="arc-section-num">Arc {arc.arcNumber}</span>
              <h2 className="arc-section-title">{arc.title}</h2>
            </header>
            <ul className="episode-list">
              {list.map((ep) => (
                <li key={ep.slug}>
                  <Link
                    href={`/shows/${showSlug}/episodes/${ep.slug}`}
                    className="episode-row"
                  >
                    <span className="episode-num">
                      Ep {String(ep.episodeNumber).padStart(2, "0")}
                    </span>
                    <span className="episode-title">{ep.title}</span>
                    {renderBadge(ep.id, !!ep.masterVideoPath)}
                    <span className="episode-meta">
                      {ep.runtimeSeconds
                        ? `${Math.round(ep.runtimeSeconds / 60)} min`
                        : "—"}
                      {ep.lockStatus && ep.lockStatus !== "draft" && (
                        <span className="episode-status">
                          · {ep.lockStatus}
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {orphanEpisodes.length > 0 && (
        <section className="arc-section">
          <header className="arc-section-head">
            <span className="arc-section-num">Unassigned</span>
            <h2 className="arc-section-title">No arc</h2>
          </header>
          <ul className="episode-list">
            {orphanEpisodes.map((ep) => (
              <li key={ep.slug}>
                <Link
                  href={`/shows/${showSlug}/episodes/${ep.slug}`}
                  className="episode-row"
                >
                  <span className="episode-num">
                    Ep {String(ep.episodeNumber).padStart(2, "0")}
                  </span>
                  <span className="episode-title">{ep.title}</span>
                  {renderBadge(ep.id, !!ep.masterVideoPath)}
                  <span className="episode-meta">
                    {ep.runtimeSeconds
                      ? `${Math.round(ep.runtimeSeconds / 60)} min`
                      : "—"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {epRows.length === 0 && (
        <p className="placeholder-text">No episodes seeded yet.</p>
      )}
    </main>
  );
}
