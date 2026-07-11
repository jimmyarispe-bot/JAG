"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function JagError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[jag-workspace]", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
      <h2 className="text-lg font-semibold text-slate-900">Executive Workspace error</h2>
      <p className="mt-2 text-sm text-slate-600">
        Something went wrong loading JAG intelligence. You can retry or return to the dashboard.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-slate-400">Digest: {error.digest}</p>
      )}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
