"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

// ─── Input ────────────────────────────────────────────────────────────────────

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded border border-(--border) bg-(--bg) px-3 py-2 text-sm text-(--text) placeholder:text-(--muted) focus:outline-none focus:ring-1 focus:ring-(--text)",
        className
      )}
      {...props}
    />
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────────

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full resize-y rounded border border-(--border) bg-(--bg) px-3 py-2 text-sm text-(--text) placeholder:text-(--muted) focus:outline-none focus:ring-1 focus:ring-(--text)",
        className
      )}
      {...props}
    />
  );
}

// ─── Label ────────────────────────────────────────────────────────────────────

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "mb-1.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-(--muted)",
        className
      )}
      {...props}
    />
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────

type ButtonVariant = "primary" | "ghost" | "ai";

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
}) {
  return (
    <button
      className={cn(
        variant === "primary" &&
          "rounded border border-(--text) bg-(--text) px-6 py-2.5 text-xs font-bold uppercase tracking-[0.15em] text-(--bg) transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40",
        variant === "ghost" &&
          "rounded border border-(--border) px-5 py-2.5 text-xs font-bold uppercase tracking-[0.15em] text-(--muted) transition-colors hover:border-(--text) hover:text-(--text)",
        variant === "ai" &&
          "inline-flex items-center gap-2 rounded border border-[color-mix(in_srgb,var(--text)_35%,transparent)] bg-[color-mix(in_srgb,var(--text)_6%,transparent)] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-(--text) transition-colors hover:border-(--text) hover:bg-[color-mix(in_srgb,var(--text)_10%,transparent)] disabled:cursor-not-allowed disabled:opacity-40",
        className
      )}
      {...props}
    />
  );
}

// ─── AiButton ─────────────────────────────────────────────────────────────────

export function AiButton({
  loading,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading: boolean;
}) {
  return (
    <Button variant="ai" disabled={loading || props.disabled} className={className} {...props}>
      <span className="text-[13px] leading-none">✦</span>
      {loading ? "Generating…" : children}
    </Button>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded border border-(--border) bg-(--panel)",
        className
      )}
      {...props}
    />
  );
}

export function AccentBar({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return <div className={cn("h-1 bg-(--accent)", className)} style={style} />;
}

/** Padded card used for wizard form sections. */
export function SectionCard({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded border border-(--border) bg-(--panel) p-6",
        className
      )}
      {...props}
    />
  );
}

// ─── DetailSection ────────────────────────────────────────────────────────────

export function DetailSection({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "border-b border-(--border) px-7 py-5 last:border-b-0",
        className
      )}
    >
      <div className="mb-1.5 border-b border-(--border) pb-1 text-[10px] uppercase tracking-[0.2em] text-(--muted)">
        {label}
      </div>
      <div className="text-sm leading-[1.6] text-(--text)">{children}</div>
    </section>
  );
}

// ─── Chip ─────────────────────────────────────────────────────────────────────

type ChipVariant = "accent" | "muted";

export function Chip({
  variant = "accent",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: ChipVariant }) {
  return (
    <span
      className={cn(
        "rounded-[2px] border px-2.5 py-[3px] text-[11px] font-bold uppercase tracking-widest",
        variant === "accent" &&
          "border-[color-mix(in_srgb,var(--accent)_30%,transparent)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-(--accent)",
        variant === "muted" &&
          "border-(--border) bg-transparent text-(--muted)",
        className
      )}
      {...props}
    />
  );
}

// ─── ErrorText ────────────────────────────────────────────────────────────────

export function ErrorText({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-[11px] text-[#ff7466]", className)}
      role="alert"
      {...props}
    />
  );
}

// ─── Links ────────────────────────────────────────────────────────────────────

const navLinkBase =
  "text-xs uppercase tracking-[0.15em] text-(--muted) no-underline transition-colors hover:text-(--text)";

/** @deprecated use BackLink or NavLink instead */
export const mutedNavLinkClass = navLinkBase;

type LinkProps = React.ComponentPropsWithoutRef<typeof Link>;

/** Back-navigation link with bottom margin — "← Back to X". */
export function BackLink({ className, ...props }: LinkProps) {
  return (
    <Link
      className={cn("mb-6 inline-block", navLinkBase, className)}
      {...props}
    />
  );
}

/** Inline action link — "Edit ↗", "View ↗". */
export function NavLink({ className, ...props }: LinkProps) {
  return (
    <Link
      className={cn("inline-block", navLinkBase, className)}
      {...props}
    />
  );
}

// ─── Card section label / body ────────────────────────────────────────────────

/** Uppercase divider label inside a card — "Personality", "Powers". */
export function CardSectionLabel({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mb-1.5 mt-3.5 border-b border-(--border) pb-1 text-[10px] uppercase tracking-[0.2em] text-(--muted)",
        className
      )}
      {...props}
    />
  );
}

/** Body text inside a card section. */
export function CardSectionBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("text-sm leading-[1.6] text-(--text)", className)}
      {...props}
    />
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

/** Standard page wrapper: max-width, horizontal padding, vertical breathing room. */
export function PageContainer({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <main
      className={cn("mx-auto max-w-[1400px] px-6 pb-20 pt-10", className)}
      {...props}
    />
  );
}

// ─── Typography ───────────────────────────────────────────────────────────────

type HeadingLevel = "h1" | "h2" | "h3";

/**
 * Fluid-size page title.
 * size="lg" → clamp(32px,5vw,48px) — top-level pages (home, episodes list)
 * size="md" → clamp(28px,4vw,40px) — nested pages (edit, script, episode detail)
 */
export function PageHeading({
  size = "lg",
  as: As = "h1",
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement> & {
  size?: "lg" | "md";
  as?: HeadingLevel;
}) {
  return (
    <As
      className={cn(
        "m-0 mb-1 font-extrabold tracking-[-0.02em] text-(--text)",
        size === "lg"
          ? "text-[clamp(32px,5vw,48px)]"
          : "text-[clamp(28px,4vw,40px)]",
        className
      )}
      {...props}
    />
  );
}

/** Muted uppercase metadata line — episode count, status, breadcrumb. */
export function Subtext({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "text-[11px] uppercase tracking-[0.15em] text-(--muted)",
        className
      )}
      {...props}
    />
  );
}

/** Bold uppercase section divider with bottom border — Heroes, Antagonists, etc. */
export function SectionHeading({
  as: As = "h3",
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement> & { as?: HeadingLevel }) {
  return (
    <As
      className={cn(
        "border-b border-(--border) pb-1.5 text-xs font-bold uppercase tracking-[0.4em] text-(--muted)",
        className
      )}
      {...props}
    />
  );
}

/** Empty-state paragraph — "No episodes yet", "No locations registered". */
export function EmptyState({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "text-[13px] uppercase tracking-widest text-(--muted)",
        className
      )}
      {...props}
    />
  );
}

// ─── Grid ─────────────────────────────────────────────────────────────────────

/**
 * Responsive auto-fit card grid.
 * minWidth controls the minimum column width before wrapping (default 300px).
 */
export function CardGrid({
  minWidth = "300px",
  gap = "gap-6",
  className,
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  minWidth?: string;
  gap?: string;
}) {
  return (
    <div
      className={cn("grid", gap, className)}
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}, 1fr))`,
        ...style,
      }}
      {...props}
    />
  );
}

// ─── ChipGrid ─────────────────────────────────────────────────────────────────

export function ChipGrid({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
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
            className={cn(
              "rounded-[2px] border px-3 py-[5px] text-[11px] font-bold uppercase tracking-widest transition-colors",
              active
                ? "border-[color-mix(in_srgb,var(--text)_60%,transparent)] bg-[color-mix(in_srgb,var(--text)_12%,transparent)] text-(--text)"
                : "border-(--border) text-(--muted) hover:border-(--text) hover:text-(--text)"
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
