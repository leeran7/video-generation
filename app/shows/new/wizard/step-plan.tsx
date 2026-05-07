"use client";

import { DESIGN_STYLES } from "@/lib/design-styles";
import { WizardState, formatDuration, formatTotalTime } from "./types";
import { sectionClass } from "./atoms";

// Rough cost estimates (per unit)
const RUNWAY_COST_PER_SEC = 0.05;   // Gen-4 video output, ~$0.05/sec
const IMAGE_COST_PER_CHAR = 0.08;   // gpt-image-1 medium quality
const MUSIC_COST_PER_MIN = 0.15;    // AI music generation

export function StepPlan({
  state,
  set,
}: {
  state: WizardState;
  set: (patch: Partial<WizardState>) => void;
}) {
  const isSingle = state.videoScope === "single";
  const totalEps = isSingle ? 1 : state.totalEpisodes;
  const totalSeconds = state.episodeSeconds * totalEps;
  const chosenStyle = DESIGN_STYLES.find((s) => s.id === state.designStyleId);

  const heroes = state.characters.filter((c) => c.type === "hero");
  const antagonists = state.characters.filter((c) => c.type === "antagonist");
  const supporting = state.characters.filter((c) => c.type === "supporting");

  // Cost breakdown
  const videoCost = totalSeconds * RUNWAY_COST_PER_SEC;
  const imageCost = state.characters.length * IMAGE_COST_PER_CHAR;
  const musicCost = (totalSeconds / 60) * MUSIC_COST_PER_MIN;
  const totalCost = videoCost + imageCost + musicCost;

  function fmt(n: number) {
    return n < 1 ? `<$1` : `$${Math.round(n).toLocaleString()}`;
  }

  return (
    <div className="space-y-5">
      {/* Show summary */}
      <div className={sectionClass}>
        <div className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-(--muted)">Show</div>
        <h2 className="mb-1 text-2xl font-extrabold tracking-[-0.01em] text-(--text)">
          {state.title || <span className="text-(--muted)">Untitled</span>}
        </h2>
        <p className="mb-3 text-[11px] uppercase tracking-[0.15em] text-(--muted)">/shows/{state.slug}</p>
        {state.logline && (
          <p className="text-sm leading-[1.6] text-(--text)">{state.logline}</p>
        )}
        {state.genres.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {[...state.genres, ...state.tones].map((g) => (
              <span
                key={g}
                className="rounded-[2px] border border-(--border) px-2.5 py-[3px] text-[10px] uppercase tracking-[0.1em] text-(--muted)"
              >
                {g}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className={sectionClass}>
          <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-(--muted)">Format</div>
          <dl className="space-y-1.5 text-sm">
            {[
              ["Episode length", formatDuration(state.episodeSeconds)],
              [isSingle ? "Type" : "Episodes", isSingle ? "Single video" : `${totalEps} episodes`],
              ["Total runtime", formatTotalTime(totalSeconds)],
              ["Platform", state.platform],
              ["Art style", chosenStyle?.label ?? state.designStyleId],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <dt className="w-28 shrink-0 text-(--muted)">{k}</dt>
                <dd className="text-(--text)">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className={sectionClass}>
          <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-(--muted)">World</div>
          {state.worldRules ? (
            <p className="line-clamp-4 text-sm leading-[1.6] text-(--text)">{state.worldRules}</p>
          ) : (
            <p className="text-[11px] text-(--muted)">No world bible added yet.</p>
          )}
        </div>
      </div>

      {state.characters.length > 0 && (
        <div className={sectionClass}>
          <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-(--muted)">
            Cast · {state.characters.length} character{state.characters.length !== 1 ? "s" : ""}
          </div>
          <div className="space-y-3">
            {(
              [
                ["Heroes", heroes],
                ["Antagonists", antagonists],
                ["Supporting", supporting],
              ] as const
            ).map(
              ([label, group]) =>
                group.length > 0 && (
                  <div key={label}>
                    <div className="mb-1.5 text-[10px] uppercase tracking-[0.15em] text-(--muted)">{label}</div>
                    <div className="flex flex-wrap gap-2">
                      {group.map((c) => (
                        <span
                          key={c.id}
                          className="rounded-[2px] border border-(--border) px-3 py-[5px] text-xs text-(--text)"
                        >
                          {c.codename || c.name || "Unnamed"}
                          {c.name && c.codename && (
                            <span className="ml-1 text-(--muted)">({c.name})</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                )
            )}
          </div>
        </div>
      )}

      {/* Production cost estimate */}
      <div className={sectionClass}>
        <div className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-(--muted)">
          Production cost estimate
        </div>

        {/* Scenes per episode control */}
        <div className="mb-5">
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-(--muted)">
            Scenes per episode
          </label>
          <div className="flex gap-2">
            {[2, 3, 4, 5, 6, 8].map((n) => {
              const active = state.scenesPerEpisode === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => set({ scenesPerEpisode: n })}
                  className={`w-10 rounded border py-2 text-sm font-bold transition-colors ${
                    active
                      ? "border-[color-mix(in_srgb,var(--text)_60%,transparent)] bg-[color-mix(in_srgb,var(--text)_10%,transparent)] text-(--text)"
                      : "border-(--border) text-(--muted) hover:border-(--text) hover:text-(--text)"
                  }`}
                >
                  {n}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-[11px] text-(--muted)">
            {state.scenesPerEpisode} scenes × {totalEps} {isSingle ? "video" : "episodes"} ={" "}
            {state.scenesPerEpisode * totalEps} total scenes
          </p>
        </div>

        <div className="space-y-2">
          {[
            ["Video generation", isSingle ? formatDuration(state.episodeSeconds) : `${totalEps} eps × ${formatDuration(state.episodeSeconds)}`, fmt(videoCost)],
            ["Character design sheets", `${state.characters.length} character${state.characters.length !== 1 ? "s" : ""}`, fmt(imageCost)],
            ["Music & soundtrack", formatTotalTime(totalSeconds), fmt(musicCost)],
          ].map(([label, detail, cost]) => (
            <div key={label as string} className="flex items-baseline justify-between gap-2 border-b border-(--border) pb-2 last:border-0 last:pb-0">
              <div>
                <span className="text-sm text-(--text)">{label}</span>
                <span className="ml-2 text-[11px] text-(--muted)">{detail}</span>
              </div>
              <span className="shrink-0 text-sm font-bold text-(--text)">{cost}</span>
            </div>
          ))}
          <div className="flex items-baseline justify-between pt-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-(--text)">
              Estimated total
            </span>
            <span className="text-xl font-extrabold tracking-tight text-(--text)">
              {fmt(totalCost)}
            </span>
          </div>
        </div>

        <p className="mt-4 text-[10px] leading-[1.6] text-(--muted)">
          Estimates based on Runway Gen-4 video (~$0.05/sec), gpt-image-1 character sheets (~$0.08/image), and AI music (~$0.15/min).
          Actual costs vary by generation settings and re-renders.
        </p>
      </div>
    </div>
  );
}
