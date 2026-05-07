"use client";

import { useState, useEffect, useRef } from "react";
import { WizardState, GENRES, TONES, slugify } from "./types";
import { sectionClass, inputClass, textareaClass, FieldLabel, ChipGrid, AiButton } from "./atoms";

function sample<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

type SlugStatus = "idle" | "checking" | "available" | "taken";

export function StepConcept({
  state,
  set,
}: {
  state: WizardState;
  set: (patch: Partial<WizardState>) => void;
}) {
  const [slugEdited, setSlugEdited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-derive slug from title
  useEffect(() => {
    if (!slugEdited) set({ slug: slugify(state.title) });
  }, [state.title, slugEdited]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced slug availability check
  useEffect(() => {
    if (!state.slug) {
      setSlugStatus("idle");
      return;
    }
    setSlugStatus("checking");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/shows/check-slug?slug=${encodeURIComponent(state.slug)}`);
        const data = (await res.json()) as { available?: boolean };
        setSlugStatus(data.available ? "available" : "taken");
      } catch {
        setSlugStatus("idle");
      }
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [state.slug]);

  async function handleAiDecide() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai/generate-concept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hint: state.title || state.logline || "" }),
      });
      const data = (await res.json()) as {
        title?: string;
        logline?: string;
        genres?: string[];
        tones?: string[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setSlugEdited(false);
      set({
        title: data.title ?? state.title,
        logline: data.logline ?? state.logline,
        genres: data.genres ?? state.genres,
        tones: data.tones ?? state.tones,
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const slugIndicator =
    slugStatus === "checking" ? (
      <span className="text-[10px] text-(--muted)">Checking…</span>
    ) : slugStatus === "available" ? (
      <span className="text-[10px] font-bold text-[#22c55e]">✓ Available</span>
    ) : slugStatus === "taken" ? (
      <span className="text-[10px] font-bold text-[#ff7466]">✗ Already taken</span>
    ) : null;

  return (
    <div className="space-y-7">
      <div className={sectionClass}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <FieldLabel>Show concept</FieldLabel>
            <p className="text-xs text-(--muted)">Fill in a title or logline, or let AI invent one.</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <AiButton onClick={handleAiDecide} loading={loading}>
              AI decide
            </AiButton>
            {error && <span className="text-[11px] text-[#ff7466]">{error}</span>}
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-[1fr_auto]">
          <div>
            <FieldLabel>Show title</FieldLabel>
            <input
              className={inputClass}
              placeholder="e.g. Nova Force, The Hollow, Cascade City…"
              value={state.title}
              onChange={(e) => set({ title: e.target.value })}
              autoFocus
            />
          </div>
          <div className="min-w-[220px]">
            <div className="mb-1.5 flex items-baseline justify-between">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-(--muted)">
                URL slug
              </label>
              {slugIndicator}
            </div>
            <div className="flex items-center gap-1">
              <span className="shrink-0 text-xs text-(--muted)">/shows/</span>
              <input
                className={`${inputClass} ${
                  slugStatus === "taken"
                    ? "border-[color-mix(in_srgb,#ff7466_50%,var(--border))] focus:ring-[#ff7466]"
                    : slugStatus === "available"
                    ? "border-[color-mix(in_srgb,#22c55e_50%,var(--border))] focus:ring-[#22c55e]"
                    : ""
                }`}
                value={state.slug}
                onChange={(e) => {
                  setSlugEdited(true);
                  // Allow hyphens mid-typing; only strip invalid chars, not trailing hyphens
                  set({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") });
                }}
                onBlur={(e) => {
                  // Clean up leading/trailing hyphens on blur
                  set({ slug: slugify(e.target.value) });
                }}
                placeholder="my-show"
              />
            </div>
            {slugStatus === "taken" && (
              <p className="mt-1 text-[10px] text-(--muted)">
                The slug will be auto-adjusted on save (e.g. {state.slug}-1).
              </p>
            )}
          </div>
        </div>

        <div className="mt-5">
          <FieldLabel>Logline</FieldLabel>
          <textarea
            className={textareaClass}
            rows={2}
            placeholder="One or two sentences: who is this about, what do they want, what's in the way?"
            value={state.logline}
            onChange={(e) => set({ logline: e.target.value })}
          />
        </div>
      </div>

      <div className={sectionClass}>
        <div className="mb-2 flex items-center justify-between">
          <FieldLabel>Genre · pick all that apply</FieldLabel>
          <button
            type="button"
            onClick={() => set({ genres: sample(GENRES, Math.floor(Math.random() * 2) + 1) })}
            className="text-[10px] font-bold uppercase tracking-[0.15em] text-(--muted) transition-colors hover:text-(--text)"
          >
            Random
          </button>
        </div>
        <ChipGrid
          options={GENRES}
          selected={state.genres}
          onToggle={(g) =>
            set({
              genres: state.genres.includes(g)
                ? state.genres.filter((x) => x !== g)
                : [...state.genres, g],
            })
          }
        />
      </div>

      <div className={sectionClass}>
        <div className="mb-2 flex items-center justify-between">
          <FieldLabel>Tone · pick all that apply</FieldLabel>
          <button
            type="button"
            onClick={() => set({ tones: sample(TONES, Math.floor(Math.random() * 2) + 2) })}
            className="text-[10px] font-bold uppercase tracking-[0.15em] text-(--muted) transition-colors hover:text-(--text)"
          >
            Random
          </button>
        </div>
        <ChipGrid
          options={TONES}
          selected={state.tones}
          onToggle={(t) =>
            set({
              tones: state.tones.includes(t)
                ? state.tones.filter((x) => x !== t)
                : [...state.tones, t],
            })
          }
        />
      </div>
    </div>
  );
}
