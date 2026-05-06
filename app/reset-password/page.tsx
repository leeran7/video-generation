"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  AuthShell,
  authInputClass,
  authLabelClass,
  authMutedLinkClass,
  authPrimaryButtonClass,
} from "@/components/auth-shell";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    createClient()
      .auth.getSession()
      .then(({ data }) => {
        if (!data.session) {
          setError("Reset link is invalid or has expired. Request a new one.");
        }
        setReady(true);
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

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
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
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
      title="Choose new password"
      subtitle="Enter a new password for your account."
      footer={
        <Link href="/login" className={authMutedLinkClass}>
          Back to sign in
        </Link>
      }
    >
      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2">
          <label className={authLabelClass} htmlFor="password">
            New password
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
            Confirm new password
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

        <button
          type="submit"
          className={authPrimaryButtonClass}
          disabled={loading || !ready}
        >
          {loading ? "Saving…" : "Save password"}
        </button>
      </form>
    </AuthShell>
  );
}
