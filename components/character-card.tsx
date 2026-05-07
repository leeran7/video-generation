import type { CSSProperties } from "react";
import type { Character } from "@/lib/character-data";
import { AccentBar, Chip, CardSectionLabel, CardSectionBody } from "@/components/ui/atoms";

export function CharacterCard({
  character,
  accent,
}: {
  character: Character;
  accent: string;
}) {
  const style = { "--accent": accent } as CSSProperties;

  return (
    <article
      className="w-full overflow-hidden rounded border border-(--border) bg-(--panel) transition-[border-color,box-shadow] duration-200 group-hover:border-(--accent) group-hover:shadow-[0_0_24px_color-mix(in_srgb,var(--accent)_18%,transparent)]"
      style={style}
    >
      <AccentBar />
      {character.imageUrl && (
        <img
          className="block aspect-square w-full border-b border-(--border) bg-black object-cover transition-transform duration-450 group-hover:scale-[1.06]"
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
        <CardSectionLabel>Personality</CardSectionLabel>
        <CardSectionBody>{character.personality}</CardSectionBody>
        <CardSectionLabel>Traits</CardSectionLabel>
        <CardSectionBody className="flex flex-wrap gap-1.5">
          {character.traits.map((trait) => (
            <Chip key={trait}>{trait}</Chip>
          ))}
        </CardSectionBody>
        <CardSectionLabel>Powers</CardSectionLabel>
        <CardSectionBody>{character.powers}</CardSectionBody>
        <CardSectionLabel>Role</CardSectionLabel>
        <CardSectionBody>{character.role}</CardSectionBody>
      </div>
    </article>
  );
}
