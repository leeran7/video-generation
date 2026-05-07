"use client";

import { useState } from "react";
import { WizardState, DraftCharacter, uid, emptyCharacter } from "./types";
import { sectionClass, inputClass, textareaClass, FieldLabel, AiButton } from "./atoms";

function CharacterCard({
  char,
  onChange,
  onRemove,
}: {
  char: DraftCharacter;
  onChange: (patch: Partial<DraftCharacter>) => void;
  onRemove: () => void;
}) {
  const typeColors: Record<DraftCharacter["type"], string> = {
    hero: "border-[color-mix(in_srgb,#22c55e_40%,var(--border))] text-[#22c55e]",
    antagonist: "border-[color-mix(in_srgb,#ff7466_40%,var(--border))] text-[#ff7466]",
    supporting: "border-[color-mix(in_srgb,var(--text)_30%,var(--border))] text-(--muted)",
  };

  return (
    <div className="rounded border border-(--border) bg-(--panel) p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {(["hero", "antagonist", "supporting"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onChange({ type: t })}
              className={`rounded-[2px] border px-2.5 py-[3px] text-[10px] font-bold uppercase tracking-[0.15em] transition-colors ${
                char.type === t
                  ? typeColors[t]
                  : "border-(--border) text-(--muted) hover:border-(--text)"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="text-[11px] uppercase tracking-[0.1em] text-(--muted) transition-colors hover:text-[#ff7466]"
        >
          Remove
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <FieldLabel>Full name</FieldLabel>
          <input
            className={inputClass}
            placeholder="Marcus Valdez"
            value={char.name}
            onChange={(e) => onChange({ name: e.target.value })}
          />
        </div>
        <div>
          <FieldLabel>Codename / alias</FieldLabel>
          <input
            className={inputClass}
            placeholder="Surge"
            value={char.codename}
            onChange={(e) => onChange({ codename: e.target.value })}
          />
        </div>
        <div>
          <FieldLabel>Role in story</FieldLabel>
          <input
            className={inputClass}
            placeholder="Reluctant leader, comic relief…"
            value={char.role}
            onChange={(e) => onChange({ role: e.target.value })}
          />
        </div>
        <div>
          <FieldLabel>Ability / defining trait</FieldLabel>
          <input
            className={inputClass}
            placeholder="Electricity manipulation…"
            value={char.ability}
            onChange={(e) => onChange({ ability: e.target.value })}
          />
        </div>
      </div>

      <div className="mt-3">
        <FieldLabel>Character brief</FieldLabel>
        <textarea
          className={textareaClass}
          rows={3}
          placeholder="Who are they, what do they want, what are they afraid of?"
          value={char.brief}
          onChange={(e) => onChange({ brief: e.target.value })}
        />
      </div>
    </div>
  );
}

export function StepCast({
  state,
  set,
}: {
  state: WizardState;
  set: (patch: Partial<WizardState>) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function setCastCount(n: number) {
    const chars = state.characters;
    if (chars.length === 0) {
      set({ castCount: n });
      return;
    }
    if (n > chars.length) {
      const extras = Array.from({ length: n - chars.length }, () => emptyCharacter());
      set({ castCount: n, characters: [...chars, ...extras] });
    } else {
      set({ castCount: n, characters: chars.slice(0, n) });
    }
  }

  function updateChar(id: string, patch: Partial<DraftCharacter>) {
    set({
      characters: state.characters.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });
  }

  async function handleGenerate() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai/generate-characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: state.title,
          logline: state.logline,
          genres: state.genres,
          worldRules: state.worldRules,
          visualStyle: state.visualStyle,
          count: state.castCount,
        }),
      });
      const data = (await res.json()) as {
        characters?: Omit<DraftCharacter, "id">[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      set({ characters: (data.characters ?? []).map((c) => ({ ...c, id: uid() })) });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-7">
      <div className={sectionClass}>
        <div className="flex flex-wrap items-end gap-6">
          <div>
            <FieldLabel>Main cast size</FieldLabel>
            <div className="flex gap-2">
              {[2, 3, 4, 5, 6, 7, 8].map((n) => {
                const active = state.castCount === n;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setCastCount(n)}
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
          </div>
          <div className="flex flex-col gap-1">
            <AiButton onClick={handleGenerate} loading={loading}>
              Generate cast
            </AiButton>
            {error && <span className="text-[11px] text-[#ff7466]">{error}</span>}
          </div>
        </div>
      </div>

      {state.characters.length > 0 && (
        <div className="space-y-4">
          {state.characters.map((char) => (
            <CharacterCard
              key={char.id}
              char={char}
              onChange={(patch) => updateChar(char.id, patch)}
              onRemove={() =>
                set({ characters: state.characters.filter((c) => c.id !== char.id) })
              }
            />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => set({ characters: [...state.characters, emptyCharacter()] })}
        className="w-full rounded border border-dashed border-(--border) py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-(--muted) transition-colors hover:border-(--text) hover:text-(--text)"
      >
        + Add character
      </button>
    </div>
  );
}
