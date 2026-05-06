"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function GenerateImageButton({
  showSlug,
  charSlug,
  defaultPrompt,
}: {
  showSlug: string;
  charSlug: string;
  defaultPrompt: string;
}) {
  const router = useRouter();
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [state, setState] = useState<"idle" | "pending" | "queued" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  async function handleGenerate() {
    setState("pending");
    setError(null);
    try {
      const res = await fetch(
        `/api/shows/${showSlug}/characters/${charSlug}/generate-image`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        }
      );
      const data = (await res.json()) as { jobId?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to start generation");
      setJobId(data.jobId ?? null);
      setState("queued");
      // Refresh after a delay to pick up the new image once the job completes.
      setTimeout(() => router.refresh(), 60_000);
    } catch (err) {
      setState("error");
      setError((err as Error).message);
    }
  }

  const inputClass =
    "w-full rounded border border-(--border) bg-(--bg) px-3 py-2 text-sm text-(--text) placeholder:text-(--muted) focus:outline-none focus:ring-1 focus:ring-(--text)";
  const btnClass =
    "rounded border border-(--border) px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-(--muted) transition-colors hover:border-(--text) hover:text-(--text) disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className="mt-5 space-y-2">
      <div className="text-[10px] uppercase tracking-[0.2em] text-(--muted)">
        Generate design
      </div>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className={inputClass}
        rows={3}
        placeholder="Describe the character design…"
        disabled={state === "pending"}
      />
      <div className="flex items-center gap-3">
        <button
          onClick={handleGenerate}
          disabled={state === "pending" || !prompt.trim()}
          className={btnClass}
        >
          {state === "pending" ? "Queuing…" : "Generate"}
        </button>
        {state === "queued" && jobId && (
          <span className="text-[11px] uppercase tracking-[0.1em] text-(--muted)">
            Job {jobId.slice(0, 8)}… queued — image will update when done.
          </span>
        )}
        {state === "error" && error && (
          <span className="text-[11px] text-[#ff7466]">{error}</span>
        )}
      </div>
    </div>
  );
}
