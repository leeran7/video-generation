"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Character } from "@/lib/character-data";

type Initial = {
  name: string;
  realName: string;
  lockStatus: string;
  data: Character;
};

const TEXTAREA_FIELDS: Array<{ key: keyof Character; label: string }> = [
  { key: "personality", label: "Personality" },
  { key: "mindset", label: "Mindset" },
  { key: "powers", label: "Powers" },
  { key: "powersSpec", label: "Powers — specifics" },
  { key: "voiceCadence", label: "Voice cadence" },
];

export function CharacterEditor({
  showSlug,
  charSlug,
  initial,
}: {
  showSlug: string;
  charSlug: string;
  initial: Initial;
}) {
  const router = useRouter();
  const [codename, setCodename] = useState(
    initial.data.codename ?? initial.name
  );
  const [realName, setRealName] = useState(
    initial.realName ?? initial.data.realName ?? ""
  );
  const [role, setRole] = useState(initial.data.role ?? "");
  const [age, setAge] = useState<string>(
    initial.data.age != null ? String(initial.data.age) : ""
  );
  const [lockStatus, setLockStatus] = useState(initial.lockStatus || "draft");
  const [data, setData] = useState<Character>(initial.data);
  const [traitsInput, setTraitsInput] = useState(
    (initial.data.traits ?? []).join(", ")
  );
  const [arcJson, setArcJson] = useState(
    JSON.stringify(initial.data.seasonOneArc ?? [], null, 2)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const isLocked = initial.lockStatus === "locked" && lockStatus === "locked";
  const [overrideLock, setOverrideLock] = useState(false);

  const setField = <K extends keyof Character>(key: K, val: Character[K]) => {
    setData((prev) => ({ ...prev, [key]: val }));
  };

  const onSave = async () => {
    if (isLocked && !overrideLock) {
      setError(
        'This character is "locked". Toggle the override below to save changes.'
      );
      return;
    }

    let parsedArc: Character["seasonOneArc"];
    try {
      parsedArc = JSON.parse(arcJson);
      if (!Array.isArray(parsedArc))
        throw new Error("seasonOneArc must be an array");
    } catch (err) {
      setError(`seasonOneArc JSON invalid: ${(err as Error).message}`);
      return;
    }

    const ageNum = age.trim() === "" ? undefined : Number(age);
    if (ageNum !== undefined && !Number.isFinite(ageNum)) {
      setError("Age must be a number");
      return;
    }

    const traits = traitsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const dataPayload: Character = {
      ...data,
      codename: codename.trim(),
      realName: realName.trim(),
      role: role.trim(),
      ...(ageNum !== undefined ? { age: ageNum } : {}),
      traits,
      seasonOneArc: parsedArc,
    };

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/shows/${showSlug}/characters/${charSlug}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: codename.trim(),
            realName: realName.trim() || null,
            lockStatus,
            data: dataPayload,
          }),
        }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      setSavedAt(Date.now());
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const labelClass = "text-[10px] uppercase tracking-[0.2em] text-(--muted)";
  const inputClass =
    "w-full rounded-[2px] border border-(--border) bg-(--bg) px-3 py-2 text-sm text-(--text) outline-none focus:border-(--text)";

  return (
    <div className="grid gap-5 rounded border border-(--border) bg-(--panel) p-6">
      <SectionHeader>Identity</SectionHeader>
      <div className="grid gap-3.5 [grid-template-columns:1fr] min-[640px]:[grid-template-columns:1fr_1fr]">
        <Field label="Codename" labelClass={labelClass}>
          <input
            className={inputClass}
            value={codename}
            onChange={(e) => setCodename(e.target.value)}
          />
        </Field>
        <Field label="Real name" labelClass={labelClass}>
          <input
            className={inputClass}
            value={realName}
            onChange={(e) => setRealName(e.target.value)}
          />
        </Field>
        <Field label="Age" labelClass={labelClass}>
          <input
            className={inputClass}
            inputMode="numeric"
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />
        </Field>
        <Field label="Role" labelClass={labelClass}>
          <input
            className={inputClass}
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
        </Field>
        <Field label="Lock status" labelClass={labelClass}>
          <select
            className={inputClass}
            value={lockStatus}
            onChange={(e) => setLockStatus(e.target.value)}
          >
            <option value="draft">draft</option>
            <option value="locked">locked</option>
          </select>
        </Field>
      </div>

      <SectionHeader>Traits</SectionHeader>
      <Field label="Traits (comma-separated)" labelClass={labelClass}>
        <input
          className={inputClass}
          value={traitsInput}
          onChange={(e) => setTraitsInput(e.target.value)}
        />
      </Field>

      <SectionHeader>Profile</SectionHeader>
      <div className="grid gap-3.5">
        {TEXTAREA_FIELDS.map((f) => (
          <Field key={f.key} label={f.label} labelClass={labelClass}>
            <textarea
              className={`${inputClass} min-h-[88px]`}
              value={(data[f.key] as string) ?? ""}
              onChange={(e) => setField(f.key, e.target.value as never)}
            />
          </Field>
        ))}
      </div>

      <SectionHeader>Season 1 arc (JSON)</SectionHeader>
      <Field
        label='Array of { act, episodes: number[], description }'
        labelClass={labelClass}
      >
        <textarea
          className={`${inputClass} min-h-[180px] font-mono text-xs`}
          value={arcJson}
          onChange={(e) => setArcJson(e.target.value)}
          spellCheck={false}
        />
      </Field>

      {isLocked && (
        <label className="flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-amber-400">
          <input
            type="checkbox"
            checked={overrideLock}
            onChange={(e) => setOverrideLock(e.target.checked)}
          />
          Allow saving over locked status
        </label>
      )}

      {error && <p className="m-0 text-[12px] text-rose-400">{error}</p>}

      <div className="flex items-center gap-3 border-t border-(--border) pt-4">
        <button
          type="button"
          onClick={onSave}
          disabled={
            saving || !codename.trim() || (isLocked && !overrideLock)
          }
          className="rounded-[2px] border border-(--text) bg-(--text) px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-(--bg) transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        {savedAt && (
          <span className="text-[11px] uppercase tracking-[0.15em] text-emerald-400">
            Saved
          </span>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  labelClass,
  children,
}: {
  label: string;
  labelClass: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-b border-(--border) pb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-(--muted)">
      {children}
    </div>
  );
}
