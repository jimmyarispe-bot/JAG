"use client";

import Link from "next/link";
import { useState } from "react";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { requestJagPasswordResetAction } from "@/lib/platform/identity/password-reset-actions";
import {
  POWERED_BY_LINE,
  type OrganizationBrand,
} from "@/lib/platform/branding";

export function JagForgotPasswordForm({
  brand,
}: {
  readonly brand: OrganizationBrand;
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const result = await requestJagPasswordResetAction({
      email: email.trim(),
      originHint: window.location.origin,
    });

    setLoading(false);
    if (!result.ok) {
      // Format / availability only — never account existence or delivery details.
      setMessage(result.error);
      return;
    }
    setSent(true);
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
        Forgot password
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        {brand.display_name} Executive Intelligence Platform
      </p>
      <p className="mt-3 text-sm text-slate-600">
        Enter your email and we&apos;ll send password reset instructions if an
        account exists.
      </p>

      {sent ? (
        <p className="mt-6 text-sm text-slate-700" role="status">
          If an account exists for that email, password reset instructions have
          been sent.
        </p>
      ) : (
        <form
          onSubmit={onSubmit}
          className="mt-6 space-y-4"
          aria-label="Forgot password form"
        >
          <label className="block text-sm">
            <span className="text-slate-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              required
              autoComplete="username"
            />
          </label>
          {message ? (
            <p className="text-sm text-red-600" role="alert">
              {message}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            style={{ backgroundColor: accent }}
          >
            {loading ? "Sending…" : "Send reset instructions"}
          </button>
        </form>
      )}

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
