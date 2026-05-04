"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-[1400px] px-6 pb-20 pt-10">
      <h1 className="mb-8 text-[clamp(32px,5vw,48px)] font-extrabold tracking-[-0.02em]">
        Sign in
      </h1>
      <div className="w-full overflow-hidden rounded border border-(--border) bg-(--panel) text-left">
        <div className="h-1 bg-(--text)" aria-hidden />
        <form className="flex flex-col gap-[22px] px-8 pb-8 pt-7" onSubmit={handleLogin}>
          <div className="flex flex-col gap-2">
            <label
              className="text-[10px] font-bold uppercase tracking-[0.3em] text-(--muted)"
              htmlFor="email"
            >
              Email
            </label>
            <input
              id="email"
              className="w-full rounded-[2px] border border-(--border) bg-(--bg) px-[14px] py-[11px] text-sm tracking-[0.02em] text-(--text) outline-none transition-colors placeholder:text-(--muted) hover:border-(--muted) focus:border-(--text) focus:ring-2 focus:ring-white/20"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label
              className="text-[10px] font-bold uppercase tracking-[0.3em] text-(--muted)"
              htmlFor="password"
            >
              Password
            </label>
            <input
              id="password"
              className="w-full rounded-[2px] border border-(--border) bg-(--bg) px-[14px] py-[11px] text-sm tracking-[0.02em] text-(--text) outline-none transition-colors placeholder:text-(--muted) hover:border-(--muted) focus:border-(--text) focus:ring-2 focus:ring-white/20"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error ? (
            <p className="m-0 text-xs leading-[1.45] text-[#ff7466]" role="alert">
              {error}
            </p>
          ) : null}
          <div className="mt-2">
            <button
              type="submit"
              className="w-fit rounded-[2px] border border-(--text) bg-(--text) px-[18px] py-[9px] text-xs uppercase tracking-[0.18em] text-(--bg) transition-opacity hover:enabled:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={loading}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
