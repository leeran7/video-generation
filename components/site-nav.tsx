"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SiteNav() {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setLoggedIn(!!data.session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const btnClass =
    "ml-auto inline-block rounded-[2px] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-(--muted) no-underline transition-colors hover:text-(--text)";

  return (
    <nav className="sticky top-0 z-50 border-b border-(--border) bg-(--bg)">
      <div className="mx-auto flex min-h-12 max-w-[1400px] items-center gap-8 px-6 py-[14px]">
        <Link
          href="/"
          className="text-sm font-extrabold tracking-[0.4em] text-(--text) no-underline"
        >
          STUDIO
        </Link>

        {loggedIn === null ? null : loggedIn ? (
          <button type="button" onClick={handleSignOut} className={btnClass}>
            Sign out
          </button>
        ) : (
          <Link
            href="/login"
            className={`${btnClass}${pathname === "/login" ? " bg-white/10 text-(--text)" : ""}`}
          >
            Sign in
          </Link>
        )}
      </div>
    </nav>
  );
}
