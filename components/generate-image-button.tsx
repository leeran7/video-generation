"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Textarea, Button } from "@/components/ui/atoms";
import { ApiClient } from "@/lib/api/client";

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
  const [state, setState] = useState<"idle" | "pending" | "queued" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  async function handleGenerate() {
    setState("pending");
    setError(null);
    try {
      const api = new ApiClient();
      const data = await api.generateCharacterImage(showSlug, charSlug, prompt);
      setJobId(data.jobId ?? null);
      setState("queued");
      setTimeout(() => router.refresh(), 60_000);
    } catch (err) {
      setState("error");
      setError((err as Error).message);
    }
  }

  return (
    <div className="mt-5 space-y-2">
      <div className="text-[10px] uppercase tracking-[0.2em] text-(--muted)">
        Generate design
      </div>
      <Textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={3}
        placeholder="Describe the character design…"
        disabled={state === "pending"}
      />
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          onClick={handleGenerate}
          disabled={state === "pending" || !prompt.trim()}
        >
          {state === "pending" ? "Queuing…" : "Generate"}
        </Button>
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
