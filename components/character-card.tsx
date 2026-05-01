import type { CSSProperties } from "react";
import type { Character } from "@/lib/character-data";

export function CharacterCard({
  character,
  accent,
}: {
  character: Character;
  accent: string;
}) {
  const style = { "--accent": accent } as CSSProperties;

  return (
    <article className="card" style={style}>
      <div className="card-bar" />
      <div className="card-body">
        <h2 className="hero-name">{character.codename}</h2>
        <p className="hero-alias">
          {character.realName} · Age {character.age}
        </p>

        <div className="section-label">Personality</div>
        <p className="section-content">{character.personality}</p>

        <div className="section-label">Traits</div>
        <div className="section-content traits-list">
          {character.traits.map((trait) => (
            <span key={trait} className="trait-tag">
              {trait}
            </span>
          ))}
        </div>

        <div className="section-label">Powers</div>
        <p className="section-content">{character.powers}</p>

        <div className="section-label">Role</div>
        <p className="section-content">{character.role}</p>
      </div>
    </article>
  );
}
