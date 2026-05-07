"use client";

import { useState } from "react";
import { WizardState, GENRES, TONES, PLATFORMS, uid } from "./types";
import { textareaClass, AiButton } from "./atoms";

type GeneratedShow = Omit<WizardState, "slug" | "scenesPerEpisode">;

export function StepQuickStart({
  onGenerated,
  onManual,
}: {
  onGenerated: (data: Partial<WizardState>) => void;
  onManual: () => void;
}) {
  const [hint, setHint] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai/generate-show", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hint: hint.trim() }),
      });
      const data = (await res.json()) as Partial<GeneratedShow> & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Generation failed");

      const chars = (data.characters ?? []).map((c) => ({ ...c, id: uid() }));
      onGenerated({ ...data, characters: chars });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8 pt-2">
      <div className="space-y-3">
        <textarea
          className={textareaClass + " min-h-[120px] text-base"}
          placeholder="Describe an idea, a genre, a vibe, a character — or leave this blank and let AI invent everything from scratch."
          value={hint}
          onChange={(e) => setHint(e.target.value)}
          autoFocus
        />
        {error && <p className="text-[11px] text-[#ff7466]">{error}</p>}
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded border border-(--text) bg-(--text) py-4 text-sm font-bold uppercase tracking-[0.18em] text-(--bg) transition-opacity hover:opacity-80 disabled:opacity-40"
        >
          <span className="text-base leading-none">✦</span>
          {loading ? "Generating your show…" : "Generate everything with AI"}
        </button>

        <button
          type="button"
          onClick={onManual}
          className="w-full rounded border border-(--border) py-3 text-[11px] font-bold uppercase tracking-[0.15em] text-(--muted) transition-colors hover:border-(--text) hover:text-(--text)"
        >
          Build it myself →
        </button>
      </div>

      <p className="text-center text-[11px] text-(--muted)">
        AI generates title, logline, genres, world, characters, and art style in one shot.
        You can edit everything before creating the show.
      </p>
    </div>
  );
}
