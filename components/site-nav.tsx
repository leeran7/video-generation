"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteNav() {
  const pathname = usePathname() ?? "";
  const loginActive = pathname === "/login";

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]">
      <div className="mx-auto flex min-h-12 max-w-[1400px] items-center gap-8 px-6 py-[14px]">
        <Link
          href="/"
          className="text-sm font-extrabold tracking-[0.4em] text-[var(--text)] no-underline"
        >
          STUDIO
        </Link>
        <Link
          href="/login"
          className={`ml-auto inline-block rounded-[2px] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.25em] text-[var(--muted)] no-underline transition-colors hover:text-[var(--text)]${
            loginActive ? " bg-white/10 text-[var(--text)]" : ""
          }`}
        >
          Sign in
        </Link>
      </div>
    </nav>
  );
}
