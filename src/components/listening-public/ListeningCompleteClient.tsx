"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readSubmittedLocally } from "@/lib/platform/listening";
import { ListeningThankYou } from "./ListeningThankYou";

export function ListeningCompleteClient({
  token,
  fallbackTitle,
}: {
  readonly token: string;
  readonly fallbackTitle?: string;
}) {
  const [state, setState] = useState<
    | { ready: false }
    | { ready: true; ok: true; title: string; privacyStatement: string }
    | { ready: true; ok: false }
  >({ ready: false });

  useEffect(() => {
    const saved = readSubmittedLocally(token);
    if (saved) {
      setState({
        ready: true,
        ok: true,
        title: saved.title,
        privacyStatement: saved.privacyStatement,
      });
    } else {
      setState({ ready: true, ok: false });
    }
  }, [token]);

  if (!state.ready) {
    return (
      <p className="text-sm text-[var(--lp-muted)]" role="status">
        Loading confirmation…
      </p>
    );
  }

  if (!state.ok) {
    return (
      <div
        className="space-y-3 rounded-md border border-[var(--lp-border)] bg-[var(--lp-panel)] px-5 py-8"
        role="status"
      >
        <h1 className="text-xl font-medium text-[var(--lp-text)]">
          No submission found
        </h1>
        <p className="text-sm text-[var(--lp-muted)]">
          {fallbackTitle
            ? `Return to “${fallbackTitle}” to complete the survey.`
            : "Return to the survey to complete your response."}
        </p>
        <Link
          href={`/listen/${encodeURIComponent(token)}`}
          className="inline-block text-sm text-[var(--lp-accent)]"
        >
          Back to survey
        </Link>
      </div>
    );
  }

  return (
    <ListeningThankYou
      title={state.title}
      privacyStatement={state.privacyStatement}
    />
  );
}
