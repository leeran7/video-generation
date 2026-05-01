import type { CSSProperties } from "react";
import type { Antagonist } from "@/lib/character-data";

export function AntagonistCard({
  antagonist,
  accent,
}: {
  antagonist: Antagonist;
  accent: string;
}) {
  const style = { "--accent": accent } as CSSProperties;
  const episodes = antagonist.episodes ?? [];
  const shortAffiliation = antagonist.affiliation?.split(/\s[—–-]\s/)[0].trim();

  return (
    <article className="card" style={style}>
      <div className="card-bar" />
      <div className="card-body">
        <div className="card-row">
          <h3 className="hero-name">{antagonist.name}</h3>
          {shortAffiliation && (
            <span className="chip">{shortAffiliation}</span>
          )}
        </div>

        {episodes.length > 0 && (
          <div className="chip-row">
            {episodes.map((n) => (
              <span key={n} className="chip chip-muted">
                Ep {n}
              </span>
            ))}
          </div>
        )}

        <div className="section-label">Role in plot</div>
        <p className="section-content">{antagonist.roleInPlot}</p>
      </div>
    </article>
  );
}
