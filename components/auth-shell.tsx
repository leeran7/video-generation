import type { ReactNode } from "react";

export const authLabelClass =
  "text-[10px] font-bold uppercase tracking-[0.3em] text-(--muted)";

export const authInputClass =
  "w-full rounded-[2px] border border-(--border) bg-(--bg) px-[14px] py-[11px] text-sm tracking-[0.02em] text-(--text) outline-none transition-colors placeholder:text-(--muted) hover:border-(--muted) focus:border-(--text) focus:ring-2 focus:ring-white/20";

export const authPrimaryButtonClass =
  "w-full rounded-[2px] border border-(--text) bg-(--text) px-[18px] py-[11px] text-xs uppercase tracking-[0.18em] text-(--bg) transition-opacity hover:enabled:opacity-90 disabled:cursor-not-allowed disabled:opacity-40";

export const authMutedLinkClass =
  "text-[11px] uppercase tracking-[0.2em] text-(--muted) no-underline transition-colors hover:text-(--text)";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-[1400px] px-6 pb-20 pt-10">
      <div className="mb-7 text-left">
        <h1 className="m-0 text-2xl font-extrabold tracking-[-0.02em] text-(--text)">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 text-xs leading-[1.55] text-(--muted)">
            {subtitle}
          </p>
        ) : null}
      </div>
      
      <div className="py-7">{children}</div>
  
      {footer ? (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-center">
          {footer}
        </div>
      ) : null}
    </main>
  );
}
