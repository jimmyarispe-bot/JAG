"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { JAG_PLATFORM_HOME_PATH } from "@/lib/jag-platform/auth";

export function JagLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? JAG_PLATFORM_HOME_PATH;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/jag-platform/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const payload = (await response.json()) as {
      ok?: boolean;
      error?: string;
    };

    if (!response.ok || !payload.ok) {
      setMessage(payload.error ?? "Sign-in failed.");
      setLoading(false);
      return;
    }

    const target = nextPath.startsWith("/jag")
      ? nextPath
      : JAG_PLATFORM_HOME_PATH;
    router.replace(target);
    router.refresh();
  };

  return (
    <main className="mx-auto mt-20 max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">The JAG™</h1>
      <p className="mt-1 text-sm text-slate-500">
        Organizational Intelligence Operating System
      </p>
      <p className="mt-4 text-xs text-slate-500">
        Platform sign-in — separate from AcademyOS.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4" aria-label="Sign in to The JAG">
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
        {message ? (
          <p className="text-sm text-red-600" role="alert">
            {message}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in to The JAG"}
        </button>
      </form>
    </main>
  );
}
