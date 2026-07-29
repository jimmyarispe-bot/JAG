"use client";

import Link from "next/link";
import { useEffect } from "react";
import { JagErrorState } from "@/components/jag/command-center";

export default function JagError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Keep technical detail out of the UI; log for operators only.
    console.error("[jag] route error", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="jag-command-center mx-auto max-w-3xl px-4 py-10">
      <JagErrorState
        title="Command Center unavailable"
        description="This page could not be rendered. Missing data, permission issues, or a temporary service problem may be involved. Stack traces are never shown to executives."
        action={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={reset}
              className="rounded border border-[var(--jag-border-strong)] bg-[var(--jag-panel-2)] px-3 py-1.5 text-xs text-[var(--jag-text)]"
            >
              Try again
            </button>
            <Link
              href="/jag"
              className="rounded border border-[var(--jag-border)] px-3 py-1.5 text-xs text-[var(--jag-muted)] hover:text-[var(--jag-text)]"
            >
              Back to overview
            </Link>
          </div>
        }
      />
    </div>
  );
}
