"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { completeInviteActivationAction } from "@/lib/platform/identity/invite-activation-actions";

export default function ActivateAccountForm() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/dashboard";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (password.length < 12) {
      setMessage("Password must be at least 12 characters.");
      return;
    }
    if (password !== confirm) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
      data: {
        must_reset_password: false,
        invite_activation: false,
        status: "active",
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    // Session remains authenticated after updateUser; finalize org membership.
    const activation = await completeInviteActivationAction();
    if ("error" in activation) {
      setMessage(activation.error);
      setLoading(false);
      return;
    }

    window.location.href = nextPath.startsWith("/") ? nextPath : "/dashboard";
  };

  return (
    <main className="mx-auto mt-24 max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Activate your account</h1>
      <p className="mt-1 text-sm text-slate-500">
        You&apos;ve been invited to AcademyOS. Create a password to finish setting up your
        account.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-4"
        aria-label="Account activation form"
      >
        <div>
          <label htmlFor="create-password" className="block text-sm font-medium text-slate-700">
            Create your password
          </label>
          <input
            id="create-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={12}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700">
            Confirm password
          </label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={12}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          aria-label="Create account"
          className="w-full rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Creating account…" : "Create Account"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-500">
        <Link href="/login/forgot" className="font-medium text-brand-700 hover:underline">
          Forgot Password
        </Link>
      </p>

      {message && (
        <p className="mt-4 text-sm text-red-600" role="alert" aria-live="polite">
          {message}
        </p>
      )}
    </main>
  );
}
