"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  AuthShell,
  authInputClass,
  authLabelClass,
  authMutedLinkClass,
  authPrimaryButtonClass,
} from "@/components/auth-shell";
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
    <AuthShell
      title="Sign in"
      subtitle="Welcome back."
      footer={
        <>
          <Link href="/forgot-password" className={authMutedLinkClass}>
            Forgot password?
          </Link>
          <Link href="/register" className={authMutedLinkClass}>
            Create account
          </Link>
        </>
      }
    >
      <form className="flex flex-col gap-5" onSubmit={handleLogin}>
        <div className="flex flex-col gap-2">
          <label className={authLabelClass} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className={authInputClass}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className={authLabelClass} htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className={authInputClass}
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

        <button
          type="submit"
          className={authPrimaryButtonClass}
          disabled={loading}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}
