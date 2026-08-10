"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import {
  getLearningPreferencesAction,
  skipLearningOnboardingAction,
  startLearningOnboardingAction,
} from "@/lib/jag-command-center/learning/actions";
import { shouldShowFirstLoginWelcome } from "@/lib/jag-command-center/learning/client";
import { THE_JAG_MARK } from "@/lib/platform/branding";

type WelcomeState =
  | { kind: "loading" }
  | { kind: "hidden" }
  | { kind: "ready" }
  | { kind: "error"; message: string };

/**
 * Lightweight first-login welcome. Persists skip/start via server actions.
 * Does not re-appear after skip or completion.
 */
export function JagFirstLoginWelcome() {
  const pathname = usePathname() ?? "";
  const [state, setState] = useState<WelcomeState>({ kind: "loading" });
  const [pending, startTransition] = useTransition();

  const loadPreferences = () => {
    if (pathname.startsWith("/jag/learn")) {
      setState({ kind: "hidden" });
      return;
    }
    let cancelled = false;
    setState({ kind: "loading" });
    void getLearningPreferencesAction()
      .then((res) => {
        if (cancelled) return;
        if (!res.ok) {
          setState({
            kind: "error",
            message:
              res.error === "unauthorized"
                ? "Sign in again to continue orientation."
                : "Learning preferences could not be loaded. Retry, or open Learn from the sidebar.",
          });
          return;
        }
        setState(
          shouldShowFirstLoginWelcome(res.preferences)
            ? { kind: "ready" }
            : { kind: "hidden" }
        );
      })
      .catch(() => {
        if (cancelled) return;
        setState({
          kind: "error",
          message:
            "Learning preferences could not be loaded. Retry, or open Learn from the sidebar.",
        });
      });
    return () => {
      cancelled = true;
    };
  };

  useEffect(() => {
    return loadPreferences();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when route changes
  }, [pathname]);

  if (state.kind === "hidden" || state.kind === "loading") return null;

  if (state.kind === "error") {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="jag-first-login-error-title"
      >
        <div className="w-full max-w-md rounded border border-[var(--jag-border-strong)] bg-[var(--jag-bg)] p-6 shadow-xl">
          <h2
            id="jag-first-login-error-title"
            className="font-[family-name:var(--font-jag-display)] text-lg font-semibold text-[var(--jag-text)]"
          >
            Welcome unavailable
          </h2>
          <p className="mt-2 text-sm text-[var(--jag-muted)]">{state.message}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              className="rounded border border-[var(--jag-border-strong)] bg-[var(--jag-panel)] px-3 py-2 text-sm text-[var(--jag-text)]"
              onClick={() => {
                startTransition(() => {
                  loadPreferences();
                });
              }}
            >
              Retry
            </button>
            <Link
              href="/jag/learn"
              className="rounded border border-[var(--jag-border)] px-3 py-2 text-sm text-[var(--jag-muted)]"
              onClick={() => setState({ kind: "hidden" })}
            >
              Open Learn
            </Link>
            <button
              type="button"
              className="rounded px-3 py-2 text-sm text-[var(--jag-muted)]"
              onClick={() => setState({ kind: "hidden" })}
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="jag-first-login-title"
    >
      <div className="w-full max-w-md rounded border border-[var(--jag-border-strong)] bg-[var(--jag-bg)] p-6 shadow-xl">
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--jag-muted)]">
          Welcome
        </p>
        <h2
          id="jag-first-login-title"
          className="mt-2 font-[family-name:var(--font-jag-display)] text-xl font-semibold text-[var(--jag-text)]"
        >
          Welcome to {THE_JAG_MARK}
        </h2>
        <p className="mt-2 text-sm text-[var(--jag-muted)]">
          The JAG is your organizational intelligence command center.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/jag/learn/start"
            className="rounded border border-[var(--jag-border-strong)] bg-[var(--jag-panel)] px-3 py-2 text-sm text-[var(--jag-text)]"
            onClick={() => {
              startTransition(async () => {
                const res = await startLearningOnboardingAction();
                if (!res.ok) {
                  setState({
                    kind: "error",
                    message:
                      "Could not start orientation. Retry, or open Learn from the sidebar.",
                  });
                  return;
                }
                setState({ kind: "hidden" });
              });
            }}
          >
            Start Here
          </Link>
          <button
            type="button"
            disabled={pending}
            className="rounded border border-[var(--jag-border)] px-3 py-2 text-sm text-[var(--jag-muted)]"
            onClick={() => {
              startTransition(async () => {
                const res = await skipLearningOnboardingAction();
                if (!res.ok) {
                  setState({
                    kind: "error",
                    message:
                      "Could not save skip. Retry, or open Learn from the sidebar.",
                  });
                  return;
                }
                setState({ kind: "hidden" });
              });
            }}
          >
            Skip for now
          </button>
        </div>
        <p className="mt-4 text-xs text-[var(--jag-muted)]">
          You can open Learn anytime from the sidebar.
        </p>
      </div>
    </div>
  );
}
