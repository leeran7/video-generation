import type { CSSProperties } from "react";
import type { Antagonist } from "@/lib/character-data";

export function AntagonistDetail({
  antagonist,
  accent,
}: {
  antagonist: Antagonist;
  accent: string;
}) {
  const style = { "--accent": accent } as CSSProperties;
  const shortAffiliation = antagonist.affiliation
    ?.split(/\s[—–-]\s/)[0]
    .trim();
  const episodes = antagonist.episodes ?? [];

  return (
    <article className="detail" style={style}>
      <div className="detail-bar" />
      <div className="detail-grid">
        {antagonist.imageUrl && (
          <div className="detail-image-wrap">
            <img
              className="detail-image"
              src={antagonist.imageUrl}
              alt={antagonist.name}
              loading="eager"
            />
          </div>
        )}

        <header className="detail-header">
          <div className="detail-eyebrow">{antagonist.type}</div>
          <h1 className="detail-name">{antagonist.name}</h1>

          <div className="chip-row">
            {shortAffiliation && (
              <span className="chip">{shortAffiliation}</span>
            )}
            {episodes.map((n) => (
              <span key={n} className="chip chip-muted">
                Ep {n}
              </span>
            ))}
            {antagonist.revealedInEpisode != null && (
              <span className="chip chip-muted">
                Revealed Ep {antagonist.revealedInEpisode}
              </span>
            )}
          </div>
        </header>
      </div>

      <Section label="Visual hook">{antagonist.visualHook}</Section>
      <Section label="Role in plot">{antagonist.roleInPlot}</Section>
      <Section label="Outcome">{antagonist.outcome}</Section>

      {antagonist.motivation && (
        <Section label="Motivation">{antagonist.motivation}</Section>
      )}
      {antagonist.publicPresentation && (
        <Section label="Public presentation">
          {antagonist.publicPresentation}
        </Section>
      )}
      {antagonist.originSketch && (
        <Section label="Origin sketch">{antagonist.originSketch}</Section>
      )}
      {antagonist.ideologicalTwist && (
        <Section label="Ideological twist">
          {antagonist.ideologicalTwist}
        </Section>
      )}
      {antagonist.methods && antagonist.methods.length > 0 && (
        <Section label="Methods">
          <ul className="methods-list">
            {antagonist.methods.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </Section>
      )}
      {antagonist.voiceNotes && (
        <Section label="Voice notes">{antagonist.voiceNotes}</Section>
      )}
      {antagonist.continuityNote && (
        <Section label="Continuity note">{antagonist.continuityNote}</Section>
      )}
    </article>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="detail-section">
      <div className="section-label">{label}</div>
      <div className="section-content">{children}</div>
    </section>
  );
}
