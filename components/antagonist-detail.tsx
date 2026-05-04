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
  const chipBase =
    "rounded-[2px] border px-2.5 py-[3px] text-[11px] font-bold uppercase tracking-[0.1em]";
  const chipAccent = `${chipBase} border-[color-mix(in_srgb,var(--accent)_30%,transparent)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)]`;
  const chipMuted = `${chipBase} border-[var(--border)] bg-transparent text-[var(--muted)]`;

  return (
    <article
      className="overflow-hidden rounded border border-[var(--border)] bg-[var(--panel)]"
      style={style}
    >
      <div className="h-1 bg-[var(--accent)]" />
      <div className="grid items-stretch border-b border-[var(--border)] [grid-template-columns:1fr] min-[721px]:[grid-template-columns:280px_1fr]">
        {antagonist.imageUrl && (
          <div className="border-b border-[var(--border)] min-[721px]:border-b-0 min-[721px]:border-r min-[721px]:border-[var(--border)]">
            <img
              className="block aspect-square w-full bg-black object-cover"
              src={antagonist.imageUrl}
              alt={antagonist.name}
              loading="eager"
            />
          </div>
        )}

        <header className="flex flex-col justify-center px-7 pb-6 pt-7">
          <div className="mb-2 text-[11px] uppercase tracking-[0.3em] text-[var(--muted)]">
            {antagonist.type}
          </div>
          <h2 className="m-0 mb-2 text-[clamp(28px,4vw,40px)] font-bold tracking-[0.05em] text-[var(--accent)]">
            {antagonist.name}
          </h2>

          <div className="mb-1 flex flex-wrap gap-1.5">
            {shortAffiliation && (
              <span className={chipAccent}>{shortAffiliation}</span>
            )}
            {episodes.map((n) => (
              <span key={n} className={chipMuted}>
                Ep {n}
              </span>
            ))}
            {antagonist.revealedInEpisode != null && (
              <span className={chipMuted}>
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
          <ul className="m-0 flex flex-col gap-1.5 pl-5">
            {antagonist.methods.map((m, i) => (
              <li key={i} className="text-sm leading-[1.55]">
                {m}
              </li>
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
    <section className="border-b border-[var(--border)] px-7 py-5 last:border-b-0">
      <div className="mb-1.5 border-b border-[var(--border)] pb-1 text-[10px] uppercase tracking-[0.3em] text-[var(--muted)]">
        {label}
      </div>
      <div className="text-sm leading-[1.6] text-[var(--text)]">{children}</div>
    </section>
  );
}
