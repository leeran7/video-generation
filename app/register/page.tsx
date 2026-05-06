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

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailTaken, setEmailTaken] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const router = useRouter();

  async function checkEmailExists(value: string): Promise<boolean> {
    if (!value || !/^\S+@\S+\.\S+$/.test(value)) return false;
    try {
      const res = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: value }),
      });
      if (!res.ok) return false;
      const { exists } = (await res.json()) as { exists: boolean };
      return !!exists;
    } catch {
      return false;
    }
  }

  async function handleEmailBlur() {
    if (!email) return;
    setCheckingEmail(true);
    const exists = await checkEmailExists(email);
    setCheckingEmail(false);
    setEmailTaken(exists);
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const exists = await checkEmailExists(email);
      if (exists) {
        setEmailTaken(true);
        return;
      }
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (data.session) {
        router.push("/");
        router.refresh();
        return;
      }

      setInfo("Check your email to confirm your account, then sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Create account"
      subtitle="Set up your studio access."
      footer={
        <Link href="/login" className={authMutedLinkClass}>
          Have an account? Sign in
        </Link>
      }
    >
      <form className="flex flex-col gap-5" onSubmit={handleRegister}>
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
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailTaken) setEmailTaken(false);
            }}
            onBlur={handleEmailBlur}
            required
          />
          {checkingEmail ? (
            <p className="m-0 text-[10px] uppercase tracking-[0.2em] text-(--muted)">
              Checking…
            </p>
          ) : emailTaken ? (
            <p
              className="m-0 text-xs leading-[1.45] text-[#ff7466]"
              role="alert"
            >
              An account with this email already exists.{" "}
              <Link
                href="/login"
                className="underline transition-colors hover:text-(--text)"
              >
                Sign in
              </Link>
              .
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          <label className={authLabelClass} htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className={authInputClass}
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className={authLabelClass} htmlFor="confirm">
            Confirm password
          </label>
          <input
            id="confirm"
            className={authInputClass}
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
          />
        </div>

        {error ? (
          <p className="m-0 text-xs leading-[1.45] text-[#ff7466]" role="alert">
            {error}
          </p>
        ) : null}
        {info ? (
          <p className="m-0 text-xs leading-[1.45] text-(--muted)">{info}</p>
        ) : null}

        <button
          type="submit"
          className={authPrimaryButtonClass}
          disabled={loading || emailTaken || checkingEmail}
        >
          {loading ? "Creating…" : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}
