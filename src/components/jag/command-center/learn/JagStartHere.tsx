"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  completeLearningOnboardingAction,
  startLearningOnboardingAction,
} from "@/lib/jag-command-center/learning/actions";
import { THE_JAG_MARK } from "@/lib/platform/branding";
import { JagSection } from "../JagSection";

export function JagStartHere() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: `Welcome to ${THE_JAG_MARK}`,
      body: "The JAG is your organizational intelligence command center.",
    },
    {
      title: "One operating environment",
      body: "Experiences are composed from your role, permissions, and evidence — not separate portals.",
    },
    {
      title: "Learn vs Conversation",
      body: "Use Learning Center for “how do I use JAG?”. Use Executive Conversation for evidence-backed organizational questions.",
    },
  ];

  const current = steps[step]!;

  return (
    <div className="mx-auto max-w-xl space-y-6" data-jag-page="learn-start">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--jag-muted)]">
          Start Here
        </p>
        <h1 className="font-[family-name:var(--font-jag-display)] text-2xl font-semibold text-[var(--jag-text)]">
          {current.title}
        </h1>
        <p className="text-sm text-[var(--jag-muted)]">{current.body}</p>
      </header>

      <JagSection title="Orientation" description={`Step ${step + 1} of ${steps.length}`}>
        <div className="flex flex-wrap gap-2">
          {step > 0 ? (
            <button
              type="button"
              className="rounded border border-[var(--jag-border)] px-3 py-1.5 text-sm text-[var(--jag-text)]"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              Previous
            </button>
          ) : null}
          {step < steps.length - 1 ? (
            <button
              type="button"
              className="rounded border border-[var(--jag-border-strong)] bg-[var(--jag-panel)] px-3 py-1.5 text-sm text-[var(--jag-text)]"
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  if (step === 0) await startLearningOnboardingAction();
                  setStep((s) => s + 1);
                });
              }}
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              className="rounded border border-[var(--jag-border-strong)] bg-[var(--jag-panel)] px-3 py-1.5 text-sm text-[var(--jag-text)]"
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  await completeLearningOnboardingAction();
                  router.push("/jag/learn/tutorials/welcome-to-the-jag");
                });
              }}
            >
              Start first tutorial
            </button>
          )}
          <Link
            href="/jag/learn"
            className="rounded px-3 py-1.5 text-sm text-[var(--jag-muted)]"
          >
            Back to Learning Center
          </Link>
        </div>
      </JagSection>
    </div>
  );
}
