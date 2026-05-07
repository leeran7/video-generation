"use client";

import { useState } from "react";
import { WizardState } from "./types";
import { Textarea, Label, SectionCard, AiButton } from "./atoms";
import { ApiClient } from "@/lib/api/client";

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
      const api = new ApiClient();
      const data = await api.generateBible({
        title: state.title,
        logline: state.logline,
        genres: state.genres,
        tones: state.tones,
        audience: "",
        settingDescription: state.settingDescription,
      });
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
      <SectionCard>
        <Label htmlFor="setting-description">Setting & world description</Label>
        <Textarea
          id="setting-description"
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
      </SectionCard>

      <SectionCard>
        <div className="space-y-5">
          <div>
            <Label htmlFor="world-rules">World rules</Label>
            <Textarea
              id="world-rules"
              rows={5}
              placeholder="What makes this world work? Its rules, physics, internal logic."
              value={state.worldRules}
              onChange={(e) => set({ worldRules: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="visual-style">Visual style & aesthetic</Label>
            <Textarea
              id="visual-style"
              rows={4}
              placeholder="Art direction, color palette, cinematography approach, lighting mood."
              value={state.visualStyle}
              onChange={(e) => set({ visualStyle: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="thematic-focus">Thematic focus</Label>
            <Textarea
              id="thematic-focus"
              rows={4}
              placeholder="What is the show really about beneath the genre surface?"
              value={state.thematicFocus}
              onChange={(e) => set({ thematicFocus: e.target.value })}
            />
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
