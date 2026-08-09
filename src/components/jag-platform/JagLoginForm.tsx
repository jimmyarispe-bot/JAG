"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  JAG_PLATFORM_FORGOT_PASSWORD_PATH,
  JAG_PLATFORM_HOME_PATH,
} from "@/lib/jag-platform/auth";
import { requestJagMagicLinkAction } from "@/lib/platform/identity/magic-link-actions";
import {
  POWERED_BY_LINE,
  type OrganizationBrand,
} from "@/lib/platform/branding";

export function JagLoginForm({
  brand,
  next: nextParam,
  error: errorParam,
  reset: resetParam,
}: {
  readonly brand: OrganizationBrand;
  /** Server-resolved `?next=` — avoids useSearchParams hydration mismatch. */
  readonly next?: string;
  /** Server-resolved `?error=` */
  readonly error?: string;
  /** Server-resolved `?reset=` */
  readonly reset?: string;
}) {
  const router = useRouter();
  const nextPath =
    nextParam && nextParam.startsWith("/")
      ? nextParam
      : JAG_PLATFORM_HOME_PATH;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [magicSent, setMagicSent] = useState(false);

  const onPasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/jag-platform/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, next: nextPath }),
    });
    const payload = (await response.json()) as {
      ok?: boolean;
      error?: string;
      requiresMfa?: boolean;
      requiresPasswordReset?: boolean;
      redirectTo?: string;
    };

    if (!response.ok || !payload.ok) {
      setMessage(payload.error ?? "Sign-in failed.");
      setLoading(false);
      return;
    }

    if (
      (payload.requiresMfa || payload.requiresPasswordReset) &&
      payload.redirectTo?.startsWith("/")
    ) {
      window.location.href = payload.redirectTo;
      return;
    }

    const target = nextPath.startsWith("/jag")
      ? nextPath
      : JAG_PLATFORM_HOME_PATH;
    router.replace(target);
    router.refresh();
  };

  const onMagicSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const result = await requestJagMagicLinkAction({
      email: email.trim(),
      originHint: window.location.origin,
      next: nextPath.startsWith("/jag") ? nextPath : JAG_PLATFORM_HOME_PATH,
    });

    setLoading(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setMagicSent(true);
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
        {brand.display_name}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        {brand.display_name} Executive Intelligence Platform
      </p>

      {errorParam === "auth_callback_failed" ? (
        <p className="mt-4 text-sm text-red-600" role="alert">
          That sign-in link is invalid or expired. Request a new magic link or
          sign in with your password.
        </p>
      ) : null}

      {mode === "password" ? (
        <form
          onSubmit={onPasswordSubmit}
          className="mt-6 space-y-4"
          aria-label={`Sign in to ${brand.display_name}`}
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
          <label className="block text-sm">
            <span className="text-slate-700">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              required
              autoComplete="current-password"
            />
          </label>
          <p className="text-right text-sm">
            <Link
              href={JAG_PLATFORM_FORGOT_PASSWORD_PATH}
              className="font-medium hover:underline"
              style={{ color: accent }}
            >
              Forgot password?
            </Link>
          </p>
          {message ? (
            <p className="text-sm text-red-600" role="alert">
              {message}
            </p>
          ) : null}
          {resetParam === "success" ? (
            <p className="text-sm text-emerald-700" role="status">
              Password updated. Sign in with your new password.
            </p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            style={{ backgroundColor: accent }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
          <p className="text-center text-sm text-slate-600">
            <button
              type="button"
              className="font-medium hover:underline"
              style={{ color: accent }}
              onClick={() => {
                setMode("magic");
                setMessage("");
                setMagicSent(false);
              }}
            >
              Send a magic link
            </button>
          </p>
        </form>
      ) : magicSent ? (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-slate-700" role="status">
            If an account exists for that email, a sign-in link has been sent.
            Check your inbox and open the link to continue.
          </p>
          <button
            type="button"
            className="w-full rounded-md border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-800"
            onClick={() => {
              setMode("password");
              setMagicSent(false);
              setMessage("");
            }}
          >
            Back to password sign in
          </button>
        </div>
      ) : (
        <form
          onSubmit={onMagicSubmit}
          className="mt-6 space-y-4"
          aria-label="Send a magic link"
        >
          <p className="text-sm text-slate-600">
            We&apos;ll email a one-time sign-in link for The JAG™ Executive
            Intelligence Platform. You may still need multi-factor authentication
            after opening the link.
          </p>
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
            {loading ? "Sending…" : "Send a magic link"}
          </button>
          <p className="text-center text-sm text-slate-600">
            <button
              type="button"
              className="font-medium hover:underline"
              style={{ color: accent }}
              onClick={() => {
                setMode("password");
                setMessage("");
              }}
            >
              Sign in with password
            </button>
          </p>
        </form>
      )}

      {brand.powered_by_enabled ? (
        <p className="mt-6 text-center text-xs text-slate-500">
          {POWERED_BY_LINE}
        </p>
      ) : null}
    </main>
  );
}
