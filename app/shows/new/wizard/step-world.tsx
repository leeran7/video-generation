"use client";

import { useState } from "react";
import { WizardState } from "./types";
import { sectionClass, textareaClass, FieldLabel, AiButton } from "./atoms";

export function StepWorld({
  state,
  set,
}: {
  state: WizardState;
  set: (patch: Partial<WizardState>) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai/generate-bible", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: state.title,
          logline: state.logline,
          genres: state.genres,
          tones: state.tones,
          settingDescription: state.settingDescription,
        }),
      });
      const data = (await res.json()) as {
        worldRules?: string;
        visualStyle?: string;
        thematicFocus?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      set({
        worldRules: data.worldRules ?? "",
        visualStyle: data.visualStyle ?? "",
        thematicFocus: data.thematicFocus ?? "",
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const canGenerate = !!state.settingDescription.trim() || !!state.logline.trim();

  return (
    <div className="space-y-7">
      <div className={sectionClass}>
        <FieldLabel>Setting & world description</FieldLabel>
        <textarea
          className={textareaClass}
          rows={4}
          placeholder="Describe the world. Where and when does the show take place? What's unusual about it?"
          value={state.settingDescription}
          onChange={(e) => set({ settingDescription: e.target.value })}
        />
        <div className="mt-4 flex items-center gap-3">
          <AiButton onClick={handleGenerate} loading={loading} disabled={!canGenerate}>
            Generate series bible
          </AiButton>
          {!canGenerate && (
            <span className="text-[11px] text-(--muted)">Add a setting or logline first</span>
          )}
          {error && <span className="text-[11px] text-[#ff7466]">{error}</span>}
        </div>
      </div>

      <div className={sectionClass}>
        <div className="space-y-5">
          <div>
            <FieldLabel>World rules</FieldLabel>
            <textarea
              className={textareaClass}
              rows={5}
              placeholder="What makes this world work? Its rules, physics, internal logic."
              value={state.worldRules}
              onChange={(e) => set({ worldRules: e.target.value })}
            />
          </div>
          <div>
            <FieldLabel>Visual style & aesthetic</FieldLabel>
            <textarea
              className={textareaClass}
              rows={4}
              placeholder="Art direction, color palette, cinematography approach, lighting mood."
              value={state.visualStyle}
              onChange={(e) => set({ visualStyle: e.target.value })}
            />
          </div>
          <div>
            <FieldLabel>Thematic focus</FieldLabel>
            <textarea
              className={textareaClass}
              rows={4}
              placeholder="What is the show really about beneath the genre surface?"
              value={state.thematicFocus}
              onChange={(e) => set({ thematicFocus: e.target.value })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
