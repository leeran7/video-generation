"use client";

import React from "react";

export const inputClass =
  "w-full rounded border border-(--border) bg-(--bg) px-3 py-2 text-sm text-(--text) placeholder:text-(--muted) focus:outline-none focus:ring-1 focus:ring-(--text)";

export const textareaClass =
  "w-full rounded border border-(--border) bg-(--bg) px-3 py-2 text-sm text-(--text) placeholder:text-(--muted) focus:outline-none focus:ring-1 focus:ring-(--text) resize-y";

export const labelClass =
  "mb-1.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-(--muted)";

export const sectionClass = "rounded border border-(--border) bg-(--panel) p-6";

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className={labelClass}>{children}</label>;
}

export function ChipGrid({
  options,
  selected,
  onToggle,
  single,
}: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  single?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className={`rounded-[2px] border px-3 py-[5px] text-[11px] font-bold uppercase tracking-[0.1em] transition-colors ${
              active
                ? "border-[color-mix(in_srgb,var(--text)_60%,transparent)] bg-[color-mix(in_srgb,var(--text)_12%,transparent)] text-(--text)"
                : "border-(--border) text-(--muted) hover:border-(--text) hover:text-(--text)"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export function AiButton({
  onClick,
  loading,
  children,
  disabled,
}: {
  onClick: () => void;
  loading: boolean;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading || disabled}
      className="inline-flex items-center gap-2 rounded border border-[color-mix(in_srgb,var(--text)_35%,transparent)] bg-[color-mix(in_srgb,var(--text)_6%,transparent)] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-(--text) transition-colors hover:border-(--text) hover:bg-[color-mix(in_srgb,var(--text)_10%,transparent)] disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span className="text-[13px] leading-none">✦</span>
      {loading ? "Generating…" : children}
    </button>
  );
}
