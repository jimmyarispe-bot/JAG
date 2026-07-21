"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { assertLoginNotThrottled } from "@/lib/auth/login-throttle";
import type { OrganizationBranding } from "@/lib/branding/types";
import { ActionButton } from "@/components/experience-system/feedback/ActionButton";

interface LoginFormProps {
  branding: OrganizationBranding;
}

export default function LoginForm({ branding }: LoginFormProps) {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const throttle = await assertLoginNotThrottled(email);
    if (!throttle.ok) {
      setMessage(throttle.error);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    const mustReset = data.user?.user_metadata?.must_reset_password === true;
    if (mustReset) {
      window.location.href = `/login/reset-required?next=${encodeURIComponent(nextPath)}`;
      return;
    }

    window.location.href = nextPath.startsWith("/") ? nextPath : "/dashboard";
    setLoading(false);
  };

  const signInTitle = branding.editionLabel
    ? `${branding.productName} — ${branding.editionLabel}`
    : branding.productName;

  return (
    <main id="login-main" className="relative mx-auto mt-24 max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <a href="#login-form" className="skip-link">
        Skip to sign-in form
      </a>
      <h1 className="text-2xl font-bold text-slate-900">{signInTitle}</h1>
      <p className="mt-1 text-sm text-slate-500">
        Staff dashboard and parent application portal
      </p>

      <form id="login-form" onSubmit={handleLogin} className="mt-6 space-y-4" aria-label="Sign in form">
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium text-slate-700">
            Email address
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="username"
            required
            placeholder="you@school.org"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            aria-required="true"
          />
        </div>

        <div>
          <label htmlFor="login-password" className="block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            aria-required="true"
          />
        </div>

        <ActionButton
          type="submit"
          variant="primary"
          size="md"
          loading={loading}
          verb="custom"
          labels={{
            idle: "Sign in",
            loading: "Signing in…",
            processing: "Signing in…",
            success: "✓ Signed in",
            error: "Unable to sign in",
          }}
          aria-label={loading ? "Signing in" : `Sign in to ${branding.productName}`}
          className="w-full"
        >
          Sign in
        </ActionButton>
      </form>

      {message && (
        <p className="mt-4 text-sm text-red-600" role="alert" aria-live="polite">
          {message}
        </p>
      )}
    </main>
  );
}
