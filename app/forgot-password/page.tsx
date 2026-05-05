"use client";

import Link from "next/link";
import { useState } from "react";

import {
  AuthShell,
  authInputClass,
  authLabelClass,
  authMutedLinkClass,
  authPrimaryButtonClass,
} from "@/components/auth-shell";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        setError(error.message);
        return;
      }
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Reset password"
      subtitle={
        sent
          ? undefined
          : "Enter the email associated with your account and we’ll send a reset link."
      }
      footer={
        <Link href="/login" className={authMutedLinkClass}>
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        <p className="m-0 text-sm leading-[1.55] text-(--text)">
          If an account exists for{" "}
          <span className="font-bold">{email}</span>, a password reset link is
          on its way. Check your inbox.
        </p>
      ) : (
        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
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

          {error ? (
            <p
              className="m-0 text-xs leading-[1.45] text-[#ff7466]"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            className={authPrimaryButtonClass}
            disabled={loading}
          >
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
