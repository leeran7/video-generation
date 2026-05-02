import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { marked } from "marked";
import { db } from "@/lib/db/client";
import { arcs, characters, episodes, shows } from "@/lib/db/schema";

marked.setOptions({ gfm: true, breaks: false });

function extractScenes(script: string): string[] {
  const lines = script.split("\n");
  const out: string[] = [];
  for (const line of lines) {
    const m = line.match(/^###\s+(SCENE\s+\d+.*)$/i);
    if (m) out.push(m[1].trim());
  }
  return out;
}

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

  const arc = ep.arcId
    ? (
        await db
          .select()
          .from(arcs)
          .where(eq(arcs.id, ep.arcId))
          .limit(1)
      )[0] ?? null
    : null;

  const focus = ep.focusCharacterId
    ? (
        await db
          .select()
          .from(characters)
          .where(eq(characters.id, ep.focusCharacterId))
          .limit(1)
      )[0] ?? null
    : null;

  const scenes = ep.scriptContent ? extractScenes(ep.scriptContent) : [];
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
          <h1 className="detail-name">{ep.title}</h1>
          <p className="detail-alias">
            {ep.runtimeSeconds
              ? `${Math.round(ep.runtimeSeconds / 60)} min`
              : "Runtime —"}
            {ep.lockStatus ? ` · ${ep.lockStatus}` : ""}
            {focus?.name ? ` · Focus: ${focus.name}` : ""}
          </p>
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

        {scenes.length > 0 && (
          <section className="detail-section">
            <div className="section-label">Scenes ({scenes.length})</div>
            <ol className="methods-list">
              {scenes.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </section>
        )}

        <section className="detail-section">
          <div className="section-label">Script</div>
          {scriptHtml ? (
            <div
              className="script-md"
              dangerouslySetInnerHTML={{ __html: scriptHtml }}
            />
          ) : (
            <p className="placeholder-text">No script content seeded.</p>
          )}
        </section>
      </div>
    </main>
  );
}
