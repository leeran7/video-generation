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
  const sectionLabelClass =
    "mb-1.5 mt-3.5 border-b border-(--border) pb-1 text-[10px] uppercase tracking-[0.2em] text-(--muted)";
  const chipClass =
    "rounded-[2px] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-2.5 py-[3px] text-[11px] font-bold uppercase tracking-[0.1em] text-(--accent)";

  return (
    <article
      className="w-full overflow-hidden rounded border border-(--border) bg-(--panel) transition-[border-color,box-shadow] duration-200 group-hover:border-(--accent) group-hover:shadow-[0_0_24px_color-mix(in_srgb,var(--accent)_18%,transparent)]"
      style={style}
    >
      <div className="h-1 bg-(--accent)" />
      {antagonist.imageUrl && (
        <img
          className="block aspect-square w-full border-b border-(--border) bg-black object-cover transition-transform duration-[450ms] group-hover:scale-[1.06]"
          src={antagonist.imageUrl}
          alt={antagonist.name}
          loading="lazy"
        />
      )}
      <div className="px-[22px] pb-6 pt-5">
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <h3 className="mb-0.5 mt-0 text-xl font-extrabold tracking-[-0.01em] text-(--accent)">
            {antagonist.name}
          </h3>
          {shortAffiliation && <span className={chipClass}>{shortAffiliation}</span>}
        </div>

        {episodes.length > 0 && (
          <div className="mb-1 flex flex-wrap gap-1.5">
            {episodes.map((n) => (
              <span
                key={n}
                className={`${chipClass} border-(--border) bg-transparent text-(--muted)`}
              >
                Ep {n}
              </span>
            ))}
          </div>
        )}
        <div className={sectionLabelClass}>Role in plot</div>
        <p className="text-sm leading-[1.6] text-(--text)">
          {antagonist.roleInPlot}
        </p>
      </div>
    </article>
  );
}
