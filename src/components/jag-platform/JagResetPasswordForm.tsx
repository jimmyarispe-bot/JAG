"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import {
  POWERED_BY_LINE,
  type OrganizationBrand,
} from "@/lib/platform/branding";
import { createClient } from "@/lib/supabase/client";

export function JagResetPasswordForm({
  brand,
}: {
  readonly brand: OrganizationBrand;
}) {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? JAG_PLATFORM_LOGIN_PATH;

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
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
      data: { must_reset_password: false },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    // Clear Supabase recovery session — does not mint a JAG platform cookie.
    await supabase.auth.signOut();

    const loginUrl = new URL(
      nextPath.startsWith("/jag/login") ? nextPath : JAG_PLATFORM_LOGIN_PATH,
      window.location.origin
    );
    loginUrl.searchParams.set("reset", "success");
    window.location.href = loginUrl.pathname + loginUrl.search;
  };

  const logoSrc = brand.light_logo_url || brand.dark_logo_url;
  const accent = brand.primary_color || "#0F172A";

  return (
    <main className="mx-auto mt-16 w-full max-w-md rounded-2xl border border-white/10 bg-white/95 p-8 shadow-lg backdrop-blur">
      {logoSrc ? (
        // eslint-disable-next-line @next/next/no-img-element -- tenant CDN / data URLs
        <img
          src={logoSrc}
          alt={brand.display_name}
          className="mb-4 h-10 max-w-[12rem] object-contain"
        />
      ) : null}
      <h1
        className="text-2xl font-semibold text-slate-900"
        style={{ fontFamily: "var(--brand-heading-font)" }}
      >
        Reset your password
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        {brand.display_name} Executive Intelligence Platform
      </p>
      <p className="mt-3 text-sm text-slate-600">
        Choose a new password. You will sign in again on The JAG™ login page —
        resetting your password does not grant platform access by itself.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-6 space-y-4"
        aria-label="Password reset form"
      >
        <label className="block text-sm">
          <span className="text-slate-700">New password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            required
            minLength={12}
            autoComplete="new-password"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-700">Confirm new password</span>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            required
            minLength={12}
            autoComplete="new-password"
          />
        </label>
        {message ? (
          <p className="text-sm text-red-600" role="alert" aria-live="polite">
            {message}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          style={{ backgroundColor: accent }}
        >
          {loading ? "Saving…" : "Save new password"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        <Link
          href={JAG_PLATFORM_LOGIN_PATH}
          className="font-medium hover:underline"
          style={{ color: accent }}
        >
          Back to sign in
        </Link>
      </p>

      {brand.powered_by_enabled ? (
        <p className="mt-4 text-center text-xs text-slate-500">
          {POWERED_BY_LINE}
        </p>
      ) : null}
    </main>
  );
}
