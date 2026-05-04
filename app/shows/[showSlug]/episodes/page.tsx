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

  const badgeBase =
    "col-start-3 justify-self-end whitespace-nowrap rounded-[2px] border px-[7px] py-[3px] text-[10px] uppercase tracking-[0.18em]";

  function renderBadge(epId: string, hasMaster: boolean) {
    const agg = sceneAgg.get(epId);
    if (hasMaster) {
      return (
        <span
          className={`${badgeBase} border-[color-mix(in_srgb,#4ec97e_50%,var(--border))] text-[#4ec97e]`}
        >
          rendered
        </span>
      );
    }
    if (!agg) return null;
    if (agg.failed > 0) {
      return (
        <span
          className={`${badgeBase} border-[color-mix(in_srgb,#ff7466_50%,var(--border))] text-[#ff7466]`}
        >
          {agg.complete}/{agg.total} · {agg.failed} failed
        </span>
      );
    }
    if (agg.complete < agg.total) {
      return (
        <span
          className={`${badgeBase} border-[color-mix(in_srgb,var(--text)_30%,var(--border))] text-(--text)`}
        >
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

  const epRowClass =
    "grid grid-cols-[80px_1fr_auto_auto] items-center gap-4 rounded border border-(--border) bg-(--panel) px-4 py-3.5 text-(--text) no-underline transition-colors hover:border-(--text) hover:bg-[color-mix(in_srgb,var(--panel)_70%,var(--bg))]";
  const arcSectionClass = "mt-9 first-of-type:mt-6";
  const arcHeadClass =
    "mb-3 flex items-baseline gap-3.5 border-b border-(--border) pb-2";
  const arcNumClass =
    "text-[11px] font-bold uppercase tracking-[0.25em] text-(--muted)";
  const arcTitleClass = "m-0 text-lg font-bold tracking-[-0.01em]";

  return (
    <main className="mx-auto max-w-[1400px] px-6 pb-20 pt-10">
      <h2 className="m-0 mb-1 text-[clamp(32px,5vw,48px)] font-extrabold tracking-[-0.02em] text-(--text)">
        Episodes
      </h2>
      <p className="mb-5 text-[11px] uppercase tracking-[0.15em] text-(--muted)">
        {epRows.length} episode{epRows.length === 1 ? "" : "s"} ·{" "}
        {arcsWithEpisodes.length} arc{arcsWithEpisodes.length === 1 ? "" : "s"}
      </p>

      {arcsWithEpisodes.map((arc) => {
        const list = byArc.get(arc.id)!;
        return (
          <section key={arc.id} className={arcSectionClass}>
            <header className={arcHeadClass}>
              <span className={arcNumClass}>Arc {arc.arcNumber}</span>
              <h2 className={arcTitleClass}>{arc.title}</h2>
            </header>
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
              {list.map((ep) => (
                <li key={ep.slug}>
                  <Link
                    href={`/shows/${showSlug}/episodes/${ep.slug}`}
                    className={epRowClass}
                  >
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-(--muted)">
                      Ep {String(ep.episodeNumber).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 text-[15px]">
                      {ep.title}
                    </span>
                    {renderBadge(ep.id, !!ep.masterVideoPath)}
                    <span className="col-start-4 justify-self-end text-[11px] uppercase tracking-[0.15em] text-(--muted)">
                      {ep.runtimeSeconds
                        ? `${Math.round(ep.runtimeSeconds / 60)} min`
                        : "—"}
                      {ep.lockStatus && ep.lockStatus !== "draft" && (
                        <span className="ml-1 text-(--text)">
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
        <section className={arcSectionClass}>
          <header className={arcHeadClass}>
            <span className={arcNumClass}>Unassigned</span>
            <h2 className={arcTitleClass}>No arc</h2>
          </header>
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            {orphanEpisodes.map((ep) => (
              <li key={ep.slug}>
                <Link
                  href={`/shows/${showSlug}/episodes/${ep.slug}`}
                  className={epRowClass}
                >
                  <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-(--muted)">
                    Ep {String(ep.episodeNumber).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 text-[15px] tracking-[0.02em]">
                    {ep.title}
                  </span>
                  {renderBadge(ep.id, !!ep.masterVideoPath)}
                  <span className="col-start-4 justify-self-end text-[11px] uppercase tracking-[0.2em] text-(--muted)">
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
        <p className="text-[13px] uppercase tracking-[0.1em] text-(--muted)">
          No episodes seeded yet.
        </p>
      )}
    </main>
  );
}
