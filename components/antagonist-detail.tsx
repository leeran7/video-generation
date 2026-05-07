import type { CSSProperties } from "react";
import type { Antagonist } from "@/lib/character-data";
import { AccentBar, Chip, DetailSection } from "@/components/ui/atoms";

export function AntagonistDetail({
  antagonist,
  accent,
}: {
  antagonist: Antagonist;
  accent: string;
}) {
  const style = { "--accent": accent } as CSSProperties;
  const shortAffiliation = antagonist.affiliation?.split(/\s[—–-]\s/)[0].trim();
  const episodes = antagonist.episodes ?? [];

  return (
    <article className="overflow-hidden rounded border border-(--border) bg-(--panel)" style={style}>
      <AccentBar />
      <div className="grid items-stretch border-b border-(--border) [grid-template-columns:1fr] min-[721px]:[grid-template-columns:280px_1fr]">
        {antagonist.imageUrl && (
          <div className="border-b border-(--border) min-[721px]:border-b-0 min-[721px]:border-r min-[721px]:border-(--border)">
            <img
              className="block aspect-square w-full bg-black object-cover"
              src={antagonist.imageUrl}
              alt={antagonist.name}
              loading="eager"
            />
          </div>
        )}

        <header className="flex flex-col justify-center px-7 pb-6 pt-7">
          <div className="mb-2 text-[11px] uppercase tracking-[0.2em] text-(--muted)">
            {antagonist.type}
          </div>
          <h2 className="m-0 mb-2 text-[clamp(28px,4vw,40px)] font-extrabold tracking-[-0.01em] text-(--accent)">
            {antagonist.name}
          </h2>

          <div className="mb-1 flex flex-wrap gap-1.5">
            {shortAffiliation && <Chip>{shortAffiliation}</Chip>}
            {episodes.map((n) => (
              <Chip key={n} variant="muted">Ep {n}</Chip>
            ))}
            {antagonist.revealedInEpisode != null && (
              <Chip variant="muted">Revealed Ep {antagonist.revealedInEpisode}</Chip>
            )}
          </div>
        </header>
      </div>

      <DetailSection label="Visual hook">{antagonist.visualHook}</DetailSection>
      <DetailSection label="Role in plot">{antagonist.roleInPlot}</DetailSection>
      <DetailSection label="Outcome">{antagonist.outcome}</DetailSection>

      {antagonist.motivation && (
        <DetailSection label="Motivation">{antagonist.motivation}</DetailSection>
      )}
      {antagonist.publicPresentation && (
        <DetailSection label="Public presentation">
          {antagonist.publicPresentation}
        </DetailSection>
      )}
      {antagonist.originSketch && (
        <DetailSection label="Origin sketch">{antagonist.originSketch}</DetailSection>
      )}
      {antagonist.ideologicalTwist && (
        <DetailSection label="Ideological twist">
          {antagonist.ideologicalTwist}
        </DetailSection>
      )}
      {antagonist.methods && antagonist.methods.length > 0 && (
        <DetailSection label="Methods">
          <ul className="m-0 flex flex-col gap-1.5 pl-5">
            {antagonist.methods.map((m, i) => (
              <li key={i} className="text-sm leading-[1.55]">
                {m}
              </li>
            ))}
          </ul>
        </DetailSection>
      )}
      {antagonist.voiceNotes && (
        <DetailSection label="Voice notes">{antagonist.voiceNotes}</DetailSection>
      )}
      {antagonist.continuityNote && (
        <DetailSection label="Continuity note">{antagonist.continuityNote}</DetailSection>
      )}
    </article>
  );
}
