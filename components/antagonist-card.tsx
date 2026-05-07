import type { CSSProperties } from "react";
import type { Antagonist } from "@/lib/character-data";
import { AccentBar, Chip, CardSectionLabel, CardSectionBody } from "@/components/ui/atoms";

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
    <article
      className="w-full overflow-hidden rounded border border-(--border) bg-(--panel) transition-[border-color,box-shadow] duration-200 group-hover:border-(--accent) group-hover:shadow-[0_0_24px_color-mix(in_srgb,var(--accent)_18%,transparent)]"
      style={style}
    >
      <AccentBar />
      {antagonist.imageUrl && (
        <img
          className="block aspect-square w-full border-b border-(--border) bg-black object-cover transition-transform duration-450 group-hover:scale-[1.06]"
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
          {shortAffiliation && <Chip>{shortAffiliation}</Chip>}
        </div>

        {episodes.length > 0 && (
          <div className="mb-1 flex flex-wrap gap-1.5">
            {episodes.map((n) => (
              <Chip key={n} variant="muted">Ep {n}</Chip>
            ))}
          </div>
        )}
        <CardSectionLabel>Role in plot</CardSectionLabel>
        <CardSectionBody>{antagonist.roleInPlot}</CardSectionBody>
      </div>
    </article>
  );
}
