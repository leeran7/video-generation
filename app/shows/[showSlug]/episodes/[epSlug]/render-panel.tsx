"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

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

const SECTION = "border-b border-[var(--border)] px-7 py-5 last:border-b-0";
const SECTION_LABEL =
  "mb-1.5 border-b border-[var(--border)] pb-1 text-[10px] uppercase tracking-[0.3em] text-[var(--muted)]";
const RENDER_BUTTON =
  "cursor-pointer rounded-[2px] border border-[var(--text)] bg-[var(--text)] px-[18px] py-[9px] font-[inherit] text-xs uppercase tracking-[0.18em] text-[var(--bg)] transition-opacity hover:enabled:opacity-85 disabled:cursor-not-allowed disabled:opacity-40";
const SELECTION_ACTION =
  "cursor-pointer rounded-[2px] border border-[var(--border)] bg-transparent px-2.5 py-[5px] font-[inherit] text-[11px] uppercase tracking-[0.16em] text-[var(--text)] transition-colors hover:enabled:border-[var(--text)] disabled:cursor-not-allowed disabled:opacity-40";

function sceneBorderClass(status: string | null): string {
  if (status === "complete")
    return "border-[color-mix(in_srgb,#4ec97e_50%,var(--border))]";
  if (status === "failed")
    return "border-[color-mix(in_srgb,#ff7466_50%,var(--border))]";
  if (status === "generating")
    return "border-[color-mix(in_srgb,var(--text)_30%,var(--border))]";
  return "border-[var(--border)]";
}

export function RenderPanel({
  showSlug,
  epSlug,
  hasScript,
  initialJob,
  initialScenes,
}: {
  showSlug: string;
  epSlug: string;
  hasScript: boolean;
  initialJob: JobResponse | null;
  initialScenes: SceneRow[];
}) {
  const router = useRouter();
  const [job, setJob] = useState<JobRow | null>(initialJob?.job ?? null);
  const [scenes, setScenes] = useState<SceneRow[]>(
    initialJob?.scenes ?? initialScenes
  );
  const [pollError, setPollError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(() => {
    if (!initialJob) return new Set();
    return new Set(
      initialJob.scenes.filter((s) => s.status === "failed").map((s) => s.id)
    );
  });
  const hasInteracted = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const status = job?.status ?? null;
  const isTerminal = status ? TERMINAL.has(status) : true;
  const inProgress = !!job && !isTerminal;

  useEffect(() => {
    if (!job || isTerminal) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const jobId = job.id;

    async function tick() {
      try {
        const res = await fetch(`/api/jobs/${jobId}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const body = (await res.json()) as JobResponse;
        if (cancelled) return;
        setJob(body.job);
        setScenes(body.scenes);
        setPollError(null);
        const next = body.job.status ?? "pending";
        if (!TERMINAL.has(next)) {
          timer = setTimeout(tick, 2000);
        } else {
          router.refresh();
        }
      } catch (err) {
        if (cancelled) return;
        setPollError((err as Error).message);
        timer = setTimeout(tick, 4000);
      }
    }

    tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [job, isTerminal, router]);

  // Auto-select failed scenes after a terminal poll, until the user touches
  // the checkboxes — then the selection is theirs to manage.
  useEffect(() => {
    if (hasInteracted.current) return;
    const failedIds = scenes
      .filter((s) => s.status === "failed")
      .map((s) => s.id);
    if (failedIds.length === 0) return;
    setSelected(new Set(failedIds));
  }, [scenes]);

  function toggle(id: string) {
    hasInteracted.current = true;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function submit() {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);
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
      hasInteracted.current = false;
      router.refresh();
    } catch (err) {
      setSubmitError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const failed = scenes.filter((s) => s.status === "failed").length;
  const done = scenes.filter((s) => s.status === "complete").length;
  const progress = (job?.progress ?? {}) as {
    scenesTotal?: number;
    phase?: string;
  };
  const total = progress.scenesTotal ?? scenes.length;
  const phase = progress.phase ?? status;
  const displayStatus =
    failed > 0 && status === "complete" ? "failed" : status;

  const buttonLabel = submitting
    ? "Queuing…"
    : selected.size > 0
      ? `Generate ${selected.size} scene${selected.size === 1 ? "" : "s"}`
      : scenes.length > 0
        ? "Select scenes"
        : "Generate scenes";

  const checkboxesEnabled = !inProgress && !submitting;
  const requiresSelection = scenes.length > 0 && checkboxesEnabled;
  const needsPick = requiresSelection && selected.size === 0;
  const buttonDisabled =
    !hasScript || submitting || inProgress || needsPick;

  const hint = !hasScript
    ? "Seed scriptContent before generating scenes."
    : inProgress
    ? phase && phase !== status
      ? `${displayStatus} · ${phase}${
          total > 0 ? ` · ${done}/${total}` : ""
        }`
      : `${displayStatus}${total > 0 ? ` · ${done}/${total}` : ""}`
    : needsPick
    ? "Select at least one scene to generate."
    : selected.size > 0
    ? `Resets ${selected.size} selected scene${
        selected.size === 1 ? "" : "s"
      } and runs generation.`
    : scenes.length === 0 && hasScript
    ? "Creates scene rows from the script, then generates each scene."
    : null;

  const errorText =
    submitError ?? job?.error ?? (pollError ? `poll: ${pollError}` : null);
  const hasMessages = !!hint || !!errorText;

  const renderButton = (
    <button
      type="button"
      onClick={submit}
      disabled={buttonDisabled}
      className={RENDER_BUTTON}
    >
      {buttonLabel}
    </button>
  );

  const messages = hasMessages && (
    <div className="flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-2">
      {hint && <span className="text-xs text-[var(--muted)]">{hint}</span>}
      {errorText && <span className="text-xs text-[#ff7466]">{errorText}</span>}
    </div>
  );

  if (scenes.length === 0) {
    return (
      <section className={SECTION}>
        <div className={SECTION_LABEL}>Render</div>
        <div className="my-3.5 flex flex-col gap-2.5 rounded-[2px] border border-[var(--border)] bg-[color-mix(in_srgb,var(--panel)_40%,transparent)] p-3">
          <div className="flex flex-wrap items-center gap-2.5">{renderButton}</div>
          {messages}
        </div>
      </section>
    );
  }
  const failedOnly = scenes.filter((s) => s.status === "failed").length;
  const isAllFailed = failedOnly === scenes.length;

  return (
    <section className={SECTION}>
      <div className={SECTION_LABEL}>
        Scenes ({scenes.length})
        {total > 0 ? ` · ${done}/${total} complete` : ""}
        {failed > 0 ? ` · ${failed} failed` : ""}
      </div>
      <div className="my-3.5 flex flex-col gap-2.5 rounded-[2px] border border-[var(--border)] bg-[color-mix(in_srgb,var(--panel)_40%,transparent)] p-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {renderButton}
          {checkboxesEnabled && (
            <>
              <span
                className="mx-1 w-px self-stretch bg-[var(--border)]"
                aria-hidden
              />
              <button
                type="button"
                className={SELECTION_ACTION}
                onClick={() => {
                  hasInteracted.current = true;
                  setSelected(new Set(scenes.map((s) => s.id)));
                }}
              >
                Select all
              </button>
              {!isAllFailed && (
                <button
                  type="button"
                  className={SELECTION_ACTION}
                  disabled={failed === 0}
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
              )}
              <button
                type="button"
                className={SELECTION_ACTION}
                disabled={selected.size === 0}
                onClick={() => {
                  hasInteracted.current = true;
                  setSelected(new Set());
                }}
              >
                Clear
              </button>
              <span className="ml-auto text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
                {selected.size} of {scenes.length} selected
              </span>
            </>
          )}
        </div>
        {messages}
      </div>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {scenes.map((s) => (
          <li
            key={s.id}
            className={`flex flex-col overflow-hidden rounded-[2px] border bg-[color-mix(in_srgb,var(--panel)_60%,transparent)] text-[13px] ${sceneBorderClass(s.status)}`}
          >
            <div className="grid grid-cols-[36px_36px_1fr_auto_auto] items-center gap-3 pr-3 min-h-12">
              <input
                type="checkbox"
                className="scene-check"
                checked={selected.has(s.id)}
                onChange={() => toggle(s.id)}
                disabled={!checkboxesEnabled}
                aria-label={`Select scene ${s.sceneNumber} for generation`}
              />
              <span className="text-right font-mono text-[var(--muted)]">
                {String(s.sceneNumber).padStart(2, "0")}
              </span>
              <span className="text-[var(--text)]">
                {s.title ?? s.sceneId ?? `Scene ${s.sceneNumber}`}
              </span>
              <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
                {s.status ?? "pending"}
              </span>
              {s.videoPath && (
                <a
                  href={s.videoPath}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] uppercase tracking-[0.18em] text-[var(--text)] no-underline"
                >
                  open ↗
                </a>
              )}
            </div>
            {s.error && (
              <p className="m-0 break-words border-t border-[color-mix(in_srgb,#ff7466_30%,var(--border))] bg-[color-mix(in_srgb,#ff7466_8%,transparent)] px-3 py-2.5 pl-[60px] text-xs leading-[1.45] text-[#ff7466]">
                {s.error}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
