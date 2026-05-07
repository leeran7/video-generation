"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ApiClient } from "@/lib/api/client";
import { markdown } from "@codemirror/lang-markdown";
import { EditorView } from "@codemirror/view";
import { autocompletion, type CompletionContext } from "@codemirror/autocomplete";
import { marked } from "marked";

const CodeMirror = dynamic(
  () => import("@uiw/react-codemirror").then((m) => m.default),
  { ssr: false }
);

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

const AUTOSAVE_MS = 1500;

marked.setOptions({ gfm: true, breaks: false });

export function ScriptEditor({
  showSlug,
  epSlug,
  initialContent,
  characterNames,
}: {
  showSlug: string;
  epSlug: string;
  initialContent: string;
  characterNames: string[];
}) {
  const [value, setValue] = useState(initialContent);
  const [state, setState] = useState<SaveState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const lastSavedRef = useRef(initialContent);
  const [lastSaved, setLastSaved] = useState(initialContent);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(
    async (next: string) => {
      setState("saving");
      try {
        const api = new ApiClient();
        await api.saveScript(showSlug, epSlug, next);
        lastSavedRef.current = next;
        setLastSaved(next);
        setErrorMsg(null);
        setState("saved");
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : String(err));
        setState("error");
      }
    },
    [showSlug, epSlug]
  );

  const handleChange = useCallback((next: string) => {
    setValue(next);
    setState((prev) =>
      next === lastSavedRef.current ? prev : "dirty"
    );
  }, []);

  useEffect(() => {
    if (state !== "dirty") return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => save(value), AUTOSAVE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state, value, save]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const html = await marked.parse(value || "");
      if (!cancelled) setPreviewHtml(html);
    })();
    return () => {
      cancelled = true;
    };
  }, [value]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state === "dirty" || state === "saving") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [state]);

  const completion = useMemo(() => {
    const options = characterNames.map((name) => ({
      label: name,
      type: "variable" as const,
    }));
    return (ctx: CompletionContext) => {
      const word = ctx.matchBefore(/@\w*/);
      if (!word || (word.from === word.to && !ctx.explicit)) return null;
      const q = word.text.replace(/^@/, "").toLowerCase();
      return {
        from: word.from + 1,
        options: options.filter((o) =>
          o.label.toLowerCase().startsWith(q)
        ),
      };
    };
  }, [characterNames]);

  const extensions = useMemo(
    () => [
      markdown(),
      EditorView.lineWrapping,
      autocompletion({ override: [completion] }),
    ],
    [completion]
  );

  return (
    <div>
      <div className="mb-3 flex items-center gap-3 text-[11px] uppercase tracking-[0.15em]">
        <SaveBadge state={state} />
        <button
          type="button"
          onClick={() => save(value)}
          disabled={state === "saving" || value === lastSaved}
          className="rounded-[2px] border border-(--border) bg-(--panel) px-3 py-1.5 font-bold text-(--text) transition-colors hover:border-(--text) disabled:cursor-not-allowed disabled:opacity-50"
        >
          Save now
        </button>
        {errorMsg && (
          <span className="text-(--muted) normal-case tracking-normal">
            {errorMsg}
          </span>
        )}
      </div>

      <div className="grid gap-4 grid-cols-[1fr] min-[1024px]:grid-cols-[1fr_1fr]">
        <div className="overflow-hidden rounded border border-(--border) bg-(--panel)">
          <CodeMirror
            value={value}
            height="70vh"
            theme="dark"
            basicSetup={{
              lineNumbers: true,
              foldGutter: true,
              highlightActiveLine: true,
              autocompletion: true,
            }}
            extensions={extensions}
            onChange={handleChange}
          />
        </div>
        <div className="overflow-auto rounded border border-(--border) bg-(--panel) max-h-[70vh]">
          <div
            className="script-md"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>
      </div>
    </div>
  );
}

function SaveBadge({ state }: { state: SaveState }) {
  const map: Record<SaveState, { label: string; color: string }> = {
    idle: { label: "No changes", color: "text-(--muted)" },
    dirty: { label: "Unsaved", color: "text-amber-400" },
    saving: { label: "Saving…", color: "text-(--muted)" },
    saved: { label: "Saved", color: "text-emerald-400" },
    error: { label: "Save failed", color: "text-rose-400" },
  };
  const { label, color } = map[state];
  return <span className={`font-bold ${color}`}>{label}</span>;
}
