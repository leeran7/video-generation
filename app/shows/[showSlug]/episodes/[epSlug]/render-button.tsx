"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RenderButton({
  showSlug,
  epSlug,
  disabled,
}: {
  showSlug: string;
  epSlug: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/shows/${showSlug}/episodes/${epSlug}/render`,
        { method: "POST" }
      );
      const text = await res.text();
      let body: { jobId?: string; error?: string } = {};
      if (text) {
        try {
          body = JSON.parse(text);
        } catch {
          throw new Error(
            `Server returned non-JSON (${res.status}): ${text.slice(0, 200)}`
          );
        }
      }
      if (!res.ok || !body.jobId) {
        throw new Error(body.error ?? `Failed (${res.status})`);
      }
      router.push(
        `/shows/${showSlug}/episodes/${epSlug}/render/${body.jobId}`
      );
    } catch (err) {
      setError((err as Error).message);
      setPending(false);
    }
  }

  return (
    <div className="render-button-wrap">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || pending}
        className="render-button"
      >
        {pending ? "Queuing…" : "Render episode"}
      </button>
      {error && <span className="render-error">{error}</span>}
    </div>
  );
}
