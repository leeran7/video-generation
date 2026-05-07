"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Textarea, Label, ErrorText } from "@/components/ui/atoms";
import { ApiClient } from "@/lib/api/client";

type CharacterOption = { slug: string; name: string };

export function MetadataEditor({
  showSlug,
  epSlug,
  initialTitle,
  initialBrief,
  initialTags,
  initialFocusCharacterSlug,
  initialLockStatus,
  characterOptions,
}: {
  showSlug: string;
  epSlug: string;
  initialTitle: string;
  initialBrief: string;
  initialTags: string[];
  initialFocusCharacterSlug: string;
  initialLockStatus: string;
  characterOptions: CharacterOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [brief, setBrief] = useState(initialBrief);
  const [tagsInput, setTagsInput] = useState(initialTags.join(", "));
  const [focusSlug, setFocusSlug] = useState(initialFocusCharacterSlug);
  const [lockStatus, setLockStatus] = useState(initialLockStatus || "draft");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const api = new ApiClient();
      await api.updateEpisode(showSlug, epSlug, {
        title: title.trim(),
        brief: brief.trim() || null,
        tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
        focusCharacterSlug: focusSlug || null,
        lockStatus,
      });
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const onCancel = () => {
    setTitle(initialTitle);
    setBrief(initialBrief);
    setTagsInput(initialTags.join(", "));
    setFocusSlug(initialFocusCharacterSlug);
    setLockStatus(initialLockStatus || "draft");
    setError(null);
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[10px] font-bold uppercase tracking-[0.2em] text-(--muted) transition-colors hover:text-(--text)"
      >
        Edit metadata ↗
      </button>
    );
  }

  return (
    <div className="mt-2 grid gap-3.5">
      <Field label="Title">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <Field label="Hook (brief)">
        <Textarea
          className="min-h-[72px]"
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
        />
      </Field>
      <Field label="Tags (comma-separated)">
        <Input
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="origin, action, surge"
        />
      </Field>
      <div className="grid gap-3.5 grid-cols-[1fr] min-[640px]:grid-cols-[2fr_1fr]">
        <Field label="Focus character">
          <select
            className="w-full rounded-[2px] border border-(--border) bg-(--bg) px-3 py-2 text-sm text-(--text) outline-none focus:border-(--text)"
            value={focusSlug}
            onChange={(e) => setFocusSlug(e.target.value)}
          >
            <option value="">— None —</option>
            {characterOptions.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Lock status">
          <select
            className="w-full rounded-[2px] border border-(--border) bg-(--bg) px-3 py-2 text-sm text-(--text) outline-none focus:border-(--text)"
            value={lockStatus}
            onChange={(e) => setLockStatus(e.target.value)}
          >
            <option value="draft">draft</option>
            <option value="locked">locked</option>
          </select>
        </Field>
      </div>

      {error && <ErrorText>{error}</ErrorText>}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !title.trim()}
          className="rounded-[2px] border border-(--text) bg-(--text) px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-(--bg) transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-[2px] border border-(--border) bg-(--panel) px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-(--muted) transition-colors hover:text-(--text)"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Label className="grid gap-1.5">
      <span>{label}</span>
      {children}
    </Label>
  );
}
