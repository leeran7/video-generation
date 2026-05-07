"use client";

import { useState } from "react";
import { WizardState, uid } from "./types";
import { Textarea, Button } from "./atoms";
import { ApiClient } from "@/lib/api/client";

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
      const api = new ApiClient();
      const data = await api.generateShow(hint.trim());
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
        <Textarea
          className="min-h-[120px] text-base"
          placeholder="Describe an idea, a genre, a vibe, a character — or leave this blank and let AI invent everything from scratch."
          value={hint}
          onChange={(e) => setHint(e.target.value)}
          autoFocus
        />
        {error && <p className="text-[11px] text-[#ff7466]">{error}</p>}
      </div>

      <div className="flex flex-col gap-3">
        <Button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 py-4 text-sm"
        >
          <span className="text-base leading-none">✦</span>
          {loading ? "Generating your show…" : "Generate everything with AI"}
        </Button>

        <Button
          variant="ghost"
          type="button"
          onClick={onManual}
          className="w-full py-3 text-[11px]"
        >
          Build it myself →
        </Button>
      </div>

      <p className="text-center text-[11px] text-(--muted)">
        AI generates title, logline, genres, world, characters, and art style in one shot.
        You can edit everything before creating the show.
      </p>
    </div>
  );
}
