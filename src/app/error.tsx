"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Sprint 210 — root error boundary. No stack traces in the UI.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] route error", error.digest ?? error.message);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium tracking-wide text-neutral-500">Error</p>
      <h1 className="mt-2 text-2xl font-semibold text-neutral-900">
        Something went wrong
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-neutral-600">
        This page could not be displayed. Try again, or return to a known
        workspace. Technical details are never shown here.
      </p>
      <div className="mt-8 flex flex-wrap gap-3 text-sm">
        <button
          type="button"
          onClick={reset}
          className="rounded border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-white hover:bg-neutral-800"
        >
          Try again
        </button>
        <Link
          href="/login"
          className="rounded border border-neutral-300 px-3 py-1.5 text-neutral-800 hover:bg-neutral-50"
        >
          Sign in
        </Link>
        <Link
          href="/dashboard"
          className="rounded border border-neutral-300 px-3 py-1.5 text-neutral-800 hover:bg-neutral-50"
        >
          Dashboard
        </Link>
      </div>
    </main>
  );
}
