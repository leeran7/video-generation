import type { CSSProperties } from "react";
import type { Character } from "@/lib/character-data";
import { AccentBar, Chip, DetailSection } from "@/components/ui/atoms";

export function CharacterDetail({
  character,
  accent,
}: {
  character: Character;
  accent: string;
}) {
  const style = { "--accent": accent } as CSSProperties;

  return (
    <article className="overflow-hidden rounded border border-(--border) bg-(--panel)" style={style}>
      <AccentBar />
      <div className="grid items-stretch border-b border-(--border) grid-cols-[1fr] min-[721px]:grid-cols-[280px_1fr]">
        {character.imageUrl && (
          <div className="border-b border-(--border) min-[721px]:border-b-0 min-[721px]:border-r min-[721px]:border-(--border)">
            <img
              className="block aspect-square w-full bg-black object-cover"
              src={character.imageUrl}
              alt={character.codename}
              loading="eager"
            />
          </div>
        )}
        <header className="flex flex-col justify-center px-7 pb-6 pt-7">
          <div className="mb-2 text-[11px] uppercase tracking-[0.2em] text-(--muted)">
            {character.icon} · Roster {character.rosterNumber}
          </div>
          <h2 className="mb-2 mt-0 text-[clamp(28px,4vw,40px)] font-extrabold tracking-[-0.01em] text-(--accent)">
            {character.codename}
          </h2>
          <p className="m-0 text-[13px] uppercase tracking-[0.15em] text-(--muted)">
            {character.realName} · Age {character.age} · {character.role}
          </p>
        </header>
      </div>

      <DetailSection label="Personality">{character.personality}</DetailSection>

      <DetailSection label="Traits">
        <div className="flex flex-wrap gap-1.5">
          {character.traits.map((trait) => (
            <Chip key={trait}>{trait}</Chip>
          ))}
        </div>
      </DetailSection>

      <DetailSection label="Mindset">{character.mindset}</DetailSection>
      <DetailSection label="Powers">{character.powers}</DetailSection>
      <DetailSection label="Powers — specifics">{character.powersSpec}</DetailSection>
      <DetailSection label="Visual distinctions">{character.visualDistinctions}</DetailSection>
      <DetailSection label="Voice cadence">{character.voiceCadence}</DetailSection>
      <DetailSection label="Humanizing details">{character.humanizingDetails}</DetailSection>
      <DetailSection label="Influences & twist">{character.influencesAndTwist}</DetailSection>
      <DetailSection label="Animation craft notes">{character.animationCraftNotes}</DetailSection>

      <DetailSection label="Season 1 arc">
        <div className="flex flex-col gap-3.5">
          {character.seasonOneArc.map((act) => (
            <div
              key={act.act}
              className="rounded-[3px] border border-[color-mix(in_srgb,var(--accent)_20%,transparent)] bg-[color-mix(in_srgb,var(--accent)_6%,transparent)] px-3.5 py-3"
            >
              <div className="mb-1.5 flex items-baseline justify-between">
                <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-(--accent)">
                  Act {act.act}
                </span>
                <span className="text-[11px] uppercase tracking-[0.12em] text-(--muted)">
                  Ep {act.episodes.join(", ")}
                </span>
              </div>
              <p className="m-0 text-sm leading-[1.55] text-(--text)">
                {act.description}
              </p>
            </div>
          ))}
        </div>
      </DetailSection>
    </article>
  );
}
