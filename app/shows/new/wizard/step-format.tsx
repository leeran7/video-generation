"use client";

import { WizardState, VideoScope, PLATFORMS, formatDuration, formatTotalTime } from "./types";
import { sectionClass, FieldLabel } from "./atoms";

const SLIDER_MIN = 10;
const SLIDER_MAX = 180;
const SLIDER_MARKS = [10, 30, 60, 90, 120, 180];

const SCOPE_OPTIONS: { value: VideoScope; label: string; sub: string }[] = [
  { value: "single", label: "Single video", sub: "One standalone production" },
  { value: "series", label: "Series", sub: "Multiple episodes, released over time" },
];


export function StepFormat({
  state,
  set,
}: {
  state: WizardState;
  set: (patch: Partial<WizardState>) => void;
}) {
  const isSingle = state.videoScope === "single";
  const totalSeconds = isSingle
    ? state.episodeSeconds
    : state.episodeSeconds * state.totalEpisodes;
  const sliderPct = ((state.episodeSeconds - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 100;

  return (
    <div className="space-y-7">
      {/* Single vs series */}
      <div className={sectionClass}>
        <FieldLabel>What are you making?</FieldLabel>
        <div className="grid grid-cols-2 gap-3">
          {SCOPE_OPTIONS.map((opt) => {
            const active = state.videoScope === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => set({ videoScope: opt.value })}
                className={`flex flex-col rounded border px-4 py-3 text-left transition-colors ${
                  active
                    ? "border-[color-mix(in_srgb,var(--text)_60%,transparent)] bg-[color-mix(in_srgb,var(--text)_8%,transparent)]"
                    : "border-(--border) hover:border-(--text)"
                }`}
              >
                <span className="text-sm font-bold text-(--text)">{opt.label}</span>
                <span className="text-[11px] text-(--muted)">{opt.sub}</span>
              </button>
            );
          })}
        </div>
      </div>

       {/* Episode count — only for series */}
       {!isSingle && (
        <div className={sectionClass}>
          <div className="mb-5 flex items-baseline justify-between gap-4">
            <FieldLabel>Number of episodes</FieldLabel>
            <input
              type="number"
              min={2}
              max={200}
              value={state.totalEpisodes}
              onChange={(e) => {
                const n = Math.max(2, Math.min(500, parseInt(e.target.value) || 2));
                set({ totalEpisodes: n });
              }}
              className="w-20 rounded border border-(--border) bg-(--bg) px-2 py-1 text-right text-sm font-bold text-(--text) focus:outline-none focus:ring-1 focus:ring-(--text) [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>

          <input
            type="range"
            min={SLIDER_MIN}
            max={SLIDER_MAX}
            step={1}
            value={Math.min(state.totalEpisodes, SLIDER_MAX)}
            onChange={(e) => set({ totalEpisodes: Number(e.target.value) })}
            className="w-full cursor-pointer appearance-none"
            style={{
              background: `linear-gradient(to right, var(--text) ${((Math.min(state.totalEpisodes, 100) - 2) / 98) * 100}%, var(--border) ${((Math.min(state.totalEpisodes, 100) - 2) / 98) * 100}%)`,
              height: "3px",
              borderRadius: "9999px",
            }}
          />
          <div className="mt-4 text-[11px] text-(--muted)">
            {state.totalEpisodes} episodes × {formatDuration(state.episodeSeconds)} ={" "}
            <strong className="text-(--text)">{formatTotalTime(totalSeconds)}</strong> total
          </div>
        </div>
      )}

      {/* Video length slider */}
      <div className={sectionClass}>
        <div className="mb-5 flex items-baseline justify-between">
          <FieldLabel>{isSingle ? "Video length" : "Episode length"}</FieldLabel>
          <span className="text-lg font-extrabold tracking-tight text-(--text)">
            {formatDuration(state.episodeSeconds)}
          </span>
        </div>

        <div className="relative pb-6">
          <input
            type="range"
            min={SLIDER_MIN}
            max={SLIDER_MAX}
            step={5}
            value={state.episodeSeconds}
            onChange={(e) => set({ episodeSeconds: Number(e.target.value) })}
            className="w-full cursor-pointer appearance-none"
            style={{
              background: `linear-gradient(to right, var(--text) ${sliderPct}%, var(--border) ${sliderPct}%)`,
              height: "3px",
              borderRadius: "9999px",
            }}
          />
          <div className="pointer-events-none absolute bottom-0 left-0 right-0">
            {SLIDER_MARKS.map((s) => {
              const pct = ((s - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 100;
              return (
                <span
                  key={s}
                  className="absolute text-[9px] text-(--muted)"
                  style={{ left: `${pct}%`, transform: "translateX(-50%)" }}
                >
                  {formatDuration(s)}
                </span>
              );
            })}
          </div>
        </div>
      </div>

     

      {/* Platform */}
      <div className={sectionClass}>
        <FieldLabel>Target platform</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => {
            const active = state.platform === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => set({ platform: p })}
                className={`rounded border px-3 py-[5px] text-[11px] font-bold uppercase tracking-[0.08em] transition-colors ${
                  active
                    ? "border-[color-mix(in_srgb,var(--text)_60%,transparent)] bg-[color-mix(in_srgb,var(--text)_10%,transparent)] text-(--text)"
                    : "border-(--border) text-(--muted) hover:border-(--text) hover:text-(--text)"
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
