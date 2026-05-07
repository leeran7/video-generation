"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { DESIGN_STYLES } from "@/lib/design-styles";
import { WizardState } from "./types";
import { Label, SectionCard, AiButton } from "./atoms";
import { ApiClient } from "@/lib/api/client";

export function StepStyle({
  state,
  set,
}: {
  state: WizardState;
  set: (patch: Partial<WizardState>) => void;
}) {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReason, setAiReason] = useState("");
  const [aiSuggestedId, setAiSuggestedId] = useState<string | null>(null);
  const [aiError, setAiError] = useState("");

  async function handleAiSuggest() {
    setAiLoading(true);
    setAiError("");
    setAiReason("");
    try {
      const api = new ApiClient();
      const data = await api.suggestStyle({
        title: state.title,
        logline: state.logline,
        genres: state.genres,
        tones: state.tones,
        settingDescription: state.settingDescription,
      });
      if (data.styleId) {
        set({ designStyleId: data.styleId });
        setAiSuggestedId(data.styleId);
        setAiReason(data.reason ?? "");
      }
    } catch (err) {
      setAiError((err as Error).message);
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <SectionCard>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Label>Art style for character design sheets</Label>
            <p className="text-xs text-(--muted)">
              This style guides how AI renders characters for your show.
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <AiButton onClick={handleAiSuggest} loading={aiLoading}>
              Suggest style
            </AiButton>
            {aiError && <span className="text-[11px] text-[#ff7466]">{aiError}</span>}
          </div>
        </div>

        {aiReason && (
          <div className="mt-4 rounded border border-[color-mix(in_srgb,var(--text)_20%,transparent)] bg-[color-mix(in_srgb,var(--text)_5%,transparent)] px-4 py-3">
            <span className="mr-2 text-[11px] font-bold uppercase tracking-[0.15em] text-(--text)">
              ✦ AI Suggestion
            </span>
            <span className="text-xs text-(--muted)">{aiReason}</span>
          </div>
        )}
      </SectionCard>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {DESIGN_STYLES.map((s) => {
          const active = state.designStyleId === s.id;
          const suggested = aiSuggestedId === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => set({ designStyleId: s.id })}
              className={cn(
                "group flex flex-col overflow-hidden rounded border text-left transition-all",
                active
                  ? "border-[color-mix(in_srgb,var(--text)_60%,transparent)] ring-1 ring-[color-mix(in_srgb,var(--text)_25%,transparent)]"
                  : "border-(--border) hover:border-(--text)"
              )}
            >
              <div className="relative aspect-square w-full overflow-hidden bg-(--panel)">
                <img
                  src={s.image}
                  alt={s.label}
                  className="h-full w-full object-cover object-top"
                  onError={(e) => {
                    const el = e.currentTarget;
                    if (!el.src.endsWith(".svg")) {
                      el.src = s.image.replace(".png", ".svg");
                    }
                  }}
                />
                {active && (
                  <div className="absolute inset-0 bg-[color-mix(in_srgb,var(--text)_8%,transparent)]" />
                )}
                {suggested && !active && (
                  <div className="absolute right-2 top-2 rounded-[2px] bg-(--text) px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.15em] text-(--bg)">
                    Suggested
                  </div>
                )}
                {suggested && active && (
                  <div className="absolute right-2 top-2 rounded-[2px] bg-(--text) px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.15em] text-(--bg)">
                    ✦ AI Pick
                  </div>
                )}
              </div>
              <div
                className={cn(
                  "flex items-center justify-between px-3 py-2.5",
                  active ? "bg-[color-mix(in_srgb,var(--text)_8%,transparent)]" : "bg-(--panel)"
                )}
              >
                <span
                  className={cn(
                    "text-[11px] font-bold uppercase tracking-[0.14em]",
                    active ? "text-(--text)" : "text-(--muted)"
                  )}
                >
                  {s.label}
                </span>
                {active && <span className="text-[10px] font-bold text-(--text)">✓</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
