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
  const sectionLabelClass =
    "mb-1.5 mt-3.5 border-b border-(--border) pb-1 text-[10px] uppercase tracking-[0.2em] text-(--muted)";
  const sectionContentClass = "text-sm leading-[1.6] text-(--text)";

  return (
    <article
      className="w-full overflow-hidden rounded border border-(--border) bg-(--panel) transition-[border-color,box-shadow] duration-200 group-hover:border-(--accent) group-hover:shadow-[0_0_24px_color-mix(in_srgb,var(--accent)_18%,transparent)]"
      style={style}
    >
      <div className="h-1 bg-(--accent)" />
      {character.imageUrl && (
        <img
          className="block aspect-square w-full border-b border-(--border) bg-black object-cover transition-transform duration-[450ms] group-hover:scale-[1.06]"
          src={character.imageUrl}
          alt={character.codename}
          loading="lazy"
        />
      )}
      <div className="px-[22px] pb-6 pt-5">
        <h2 className="mb-0.5 mt-0 text-xl font-extrabold tracking-[-0.01em] text-(--accent)">
          {character.codename}
        </h2>
        <p className="mb-4 mt-0 text-xs uppercase tracking-[0.2em] text-(--muted)">
          {character.realName} · Age {character.age}
        </p>
        <div className={sectionLabelClass}>Personality</div>
        <p className={sectionContentClass}>{character.personality}</p>
        <div className={sectionLabelClass}>Traits</div>
        <div className={`${sectionContentClass} flex flex-wrap gap-1.5`}>
          {character.traits.map((trait) => (
            <span
              key={trait}
              className="rounded-[2px] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-2.5 py-[3px] text-[11px] font-bold uppercase tracking-[0.1em] text-(--accent)"
            >
              {trait}
            </span>
          ))}
        </div>
        <div className={sectionLabelClass}>Powers</div>
        <p className={sectionContentClass}>{character.powers}</p>
        <div className={sectionLabelClass}>Role</div>
        <p className={sectionContentClass}>{character.role}</p>
      </div>
    </article>
  );
}
