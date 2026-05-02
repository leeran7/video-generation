import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { arcs, episodes, shows } from "@/lib/db/schema";

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
