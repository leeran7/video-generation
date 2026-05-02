"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { RenderButton } from "../../render-button";

type SceneRow = {
  id: string;
  sceneNumber: number;
  sceneId: string | null;
  title: string | null;
  status: string | null;
  videoPath: string | null;
  error: string | null;
};

type JobRow = {
  id: string;
  type: string;
  status: string | null;
  episodeId: string | null;
  progress: Record<string, unknown> | null;
  result: Record<string, unknown> | null;
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
};

type JobResponse = {
  job: JobRow;
  scenes: SceneRow[];
  masterVideoPath: string | null;
};

const TERMINAL = new Set(["complete", "failed", "error", "expired"]);

export function RenderConsole({
  jobId,
  showSlug,
  epSlug,
  initialData,
}: {
  jobId: string;
  showSlug: string;
  epSlug: string;
  initialData?: JobResponse;
}) {
  const router = useRouter();
  const [data, setData] = useState<JobResponse | null>(initialData ?? null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(() => {
    if (!initialData) return new Set();
    return new Set(
      initialData.scenes.filter((s) => s.status === "failed").map((s) => s.id)
    );
  });
  const hasInteracted = useRef(false);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function tick() {
      try {
        const res = await fetch(`/api/jobs/${jobId}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const body = (await res.json()) as JobResponse;
        if (cancelled) return;
        setData(body);
        setError(null);
        const status = body.job.status ?? "pending";
        if (!TERMINAL.has(status)) {
          timer = setTimeout(tick, 2000);
        }
      } catch (err) {
        if (cancelled) return;
        setError((err as Error).message);
        timer = setTimeout(tick, 4000);
      }
    }

    tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [jobId]);

  // Auto-select all failed scenes whenever poll data refreshes — until the
  // user touches a checkbox, then the selection is theirs to manage.
  useEffect(() => {
    if (hasInteracted.current || !data) return;
    const next = new Set(
      data.scenes.filter((s) => s.status === "failed").map((s) => s.id)
    );
    setSelected(next);
  }, [data]);

  function toggle(id: string) {
    hasInteracted.current = true;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function retry() {
    if (retrying) return;
    setRetrying(true);
    setRetryError(null);
    try {
      const res = await fetch(
        `/api/shows/${showSlug}/episodes/${epSlug}/render`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sceneIds: [...selected] }),
        }
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
      setRetryError((err as Error).message);
      setRetrying(false);
    }
  }

  if (!data) {
    return (
      <section className="detail-section">
        <div className="section-label">Status</div>
        <p className="placeholder-text">
          {error ? `Error: ${error}` : "Loading…"}
        </p>
      </section>
    );
  }

  const { job, scenes, masterVideoPath } = data;
  const status = job.status ?? "pending";
  const progress = (job.progress ?? {}) as {
    scenesTotal?: number;
    scenesComplete?: number;
    phase?: string;
  };
  const total = progress.scenesTotal ?? scenes.length;
  const done = scenes.filter((s) => s.status === "complete").length;
  const failed = scenes.filter((s) => s.status === "failed").length;
  const phase = progress.phase ?? status;
  const isTerminal = TERMINAL.has(status);
  const hasFailures = failed > 0;
  const displayStatus =
    hasFailures && status === "complete" ? "failed" : status;
  const hasRetryableScenes = scenes.some(
    (s) => s.status === "failed" || s.status === "pending"
  );
  const showRetry =
    isTerminal &&
    (hasFailures || status !== "complete") &&
    (hasRetryableScenes || total === 0);

  return (
    <>
      <section className="detail-section">
        <div className="section-label">Status</div>
        <p className="section-content">
          <strong>{displayStatus}</strong>
          {phase && phase !== status && !isTerminal ? ` · ${phase}` : ""}
          {total > 0 ? ` · ${done}/${total} complete` : ""}
          {failed > 0 ? ` · ${failed} failed` : ""}
        </p>
        {job.error && <p className="render-error">{job.error}</p>}
        {showRetry && (
          <div className="render-retry">
            {scenes.length > 0 ? (
              <>
                <button
                  type="button"
                  onClick={retry}
                  disabled={retrying || selected.size === 0}
                  className="render-button"
                >
                  {retrying
                    ? "Re-queuing…"
                    : `Retry ${selected.size} scene${
                        selected.size === 1 ? "" : "s"
                      }`}
                </button>
                <span className="render-hint">
                  {selected.size === 0
                    ? "Tick a scene below to retry it."
                    : "Selected scenes will be reset and re-attempted; others stay as-is."}
                </span>
                {retryError && (
                  <span className="render-error">{retryError}</span>
                )}
              </>
            ) : (
              <RenderButton
                showSlug={showSlug}
                epSlug={epSlug}
                label="Re-run render"
                pendingLabel="Re-queuing…"
              />
            )}
          </div>
        )}
      </section>

      {scenes.length > 0 && (
        <section className="detail-section">
          <div className="section-label">Scenes</div>
          {showRetry && (
            <div className="selection-bar">
              <button
                type="button"
                className="selection-action"
                disabled={retrying}
                onClick={() => {
                  hasInteracted.current = true;
                  setSelected(new Set(scenes.map((s) => s.id)));
                }}
              >
                Select all
              </button>
              <button
                type="button"
                className="selection-action"
                disabled={retrying || failed === 0}
                onClick={() => {
                  hasInteracted.current = true;
                  setSelected(
                    new Set(
                      scenes
                        .filter((s) => s.status === "failed")
                        .map((s) => s.id)
                    )
                  );
                }}
              >
                Failed only
              </button>
              <button
                type="button"
                className="selection-action"
                disabled={retrying || selected.size === 0}
                onClick={() => {
                  hasInteracted.current = true;
                  setSelected(new Set());
                }}
              >
                Clear
              </button>
              <span className="selection-count">
                {selected.size} of {scenes.length} selected
              </span>
            </div>
          )}
          <ul className="scene-list">
            {scenes.map((s) => (
              <li
                key={s.id}
                className={`scene-row scene-${s.status ?? "pending"}`}
              >
                <input
                  type="checkbox"
                  className="scene-check"
                  checked={selected.has(s.id)}
                  onChange={() => toggle(s.id)}
                  disabled={!isTerminal || retrying}
                  aria-label={`Select scene ${s.sceneNumber} for retry`}
                />
                <span className="scene-num">
                  {String(s.sceneNumber).padStart(2, "0")}
                </span>
                <span className="scene-title">
                  {s.title ?? s.sceneId ?? `Scene ${s.sceneNumber}`}
                </span>
                <span className="scene-status">{s.status ?? "pending"}</span>
                {s.videoPath && (
                  <a
                    href={s.videoPath}
                    target="_blank"
                    rel="noreferrer"
                    className="scene-link"
                  >
                    open ↗
                  </a>
                )}
                {s.error && <span className="scene-error">{s.error}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {masterVideoPath && (
        <section className="detail-section">
          <div className="section-label">Master</div>
          <a
            className="render-master-link"
            href={masterVideoPath}
            target="_blank"
            rel="noreferrer"
          >
            Open master video ↗
          </a>
        </section>
      )}
    </>
  );
}
