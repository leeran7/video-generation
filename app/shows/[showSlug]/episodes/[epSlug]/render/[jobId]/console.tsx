"use client";

import { useEffect, useState } from "react";

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

export function RenderConsole({ jobId }: { jobId: string }) {
  const [data, setData] = useState<JobResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

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
  const phase = progress.phase ?? status;

  return (
    <>
      <section className="detail-section">
        <div className="section-label">Status</div>
        <p className="section-content">
          <strong>{status}</strong>
          {phase && phase !== status ? ` · ${phase}` : ""}
          {total > 0 ? ` · ${done}/${total} scenes` : ""}
        </p>
        {job.error && <p className="render-error">{job.error}</p>}
      </section>

      {scenes.length > 0 && (
        <section className="detail-section">
          <div className="section-label">Scenes</div>
          <ul className="scene-list">
            {scenes.map((s) => (
              <li key={s.id} className={`scene-row scene-${s.status ?? "pending"}`}>
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
