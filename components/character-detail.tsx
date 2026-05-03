import type { CSSProperties } from "react";
import type { Character } from "@/lib/character-data";

export function CharacterDetail({
  character,
  accent,
}: {
  character: Character;
  accent: string;
}) {
  const style = { "--accent": accent } as CSSProperties;

  return (
    <article className="detail" style={style}>
      <div className="detail-bar" />
      <div className="detail-grid">
        {character.imageUrl && (
          <div className="detail-image-wrap">
            <img
              className="detail-image"
              src={character.imageUrl}
              alt={character.codename}
              loading="eager"
            />
          </div>
        )}

        <header className="detail-header">
          <div className="detail-eyebrow">
            {character.icon} · Roster {character.rosterNumber}
          </div>
          <h2 className="detail-name">{character.codename}</h2>
          <p className="detail-alias">
            {character.realName} · Age {character.age} · {character.role}
          </p>
        </header>
      </div>

      <Section label="Personality">{character.personality}</Section>

      <Section label="Traits">
        <div className="traits-list">
          {character.traits.map((trait) => (
            <span key={trait} className="trait-tag">
              {trait}
            </span>
          ))}
        </div>
      </Section>

      <Section label="Mindset">{character.mindset}</Section>
      <Section label="Powers">{character.powers}</Section>
      <Section label="Powers — specifics">{character.powersSpec}</Section>
      <Section label="Visual distinctions">
        {character.visualDistinctions}
      </Section>
      <Section label="Voice cadence">{character.voiceCadence}</Section>
      <Section label="Humanizing details">{character.humanizingDetails}</Section>
      <Section label="Influences & twist">{character.influencesAndTwist}</Section>
      <Section label="Animation craft notes">
        {character.animationCraftNotes}
      </Section>

      <Section label="Season 1 arc">
        <div className="arc-list">
          {character.seasonOneArc.map((act) => (
            <div key={act.act} className="arc-block">
              <div className="arc-head">
                <span className="arc-act">Act {act.act}</span>
                <span className="arc-eps">
                  Ep {act.episodes.join(", ")}
                </span>
              </div>
              <p className="arc-desc">{act.description}</p>
            </div>
          ))}
        </div>
      </Section>
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
