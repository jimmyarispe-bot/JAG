"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type {
  JagLearnTutorial,
  JagLearnUserProgress,
} from "@/lib/jag-command-center/learning/client";
import {
  advanceTutorialAction,
  completeTutorialAction,
  startTutorialAction,
  walkthroughControlAction,
} from "@/lib/jag-command-center/learning/actions";
import { JagSection } from "../JagSection";
import { JagLearningVideo } from "./JagLearningVideo";

export function JagTutorialDetail({
  tutorial,
  initialProgress,
}: {
  readonly tutorial: JagLearnTutorial;
  readonly initialProgress: JagLearnUserProgress | null;
}) {
  const [progress, setProgress] = useState(initialProgress);
  const [highlight, setHighlight] = useState<readonly string[]>([]);
  const [pending, startTransition] = useTransition();
  const stepIndex = progress?.currentStep ?? 0;
  const step = tutorial.content.steps[stepIndex] ?? tutorial.content.steps[0];
  const total = tutorial.content.steps.length;

  return (
    <div className="space-y-6" data-jag-page={`tutorial-${tutorial.slug}`}>
      <header className="space-y-1">
        <p className="text-xs text-[var(--jag-muted)]">{tutorial.code}</p>
        <h1 className="font-[family-name:var(--font-jag-display)] text-2xl font-semibold text-[var(--jag-text)]">
          {tutorial.title}
        </h1>
      </header>

      <JagSection
        title="Mr. JAG™ video"
        description="Catalog instructional video from Mr. JAG™."
      >
        <JagLearningVideo
          videoUrl={tutorial.videoUrl}
          title={tutorial.title}
        />
      </JagSection>

      <JagSection
        title="About this tutorial"
        description={`${tutorial.estimatedMinutes} min · ${
          progress?.status === "completed"
            ? "Completed"
            : `${progress?.progressPercent ?? 0}% complete`
        }`}
      >
        <p className="text-sm leading-relaxed text-[var(--jag-text)]">
          {tutorial.description}
        </p>
        {tutorial.content.summary ? (
          <p className="mt-2 text-sm text-[var(--jag-muted)]">
            {tutorial.content.summary}
          </p>
        ) : null}
      </JagSection>

      <JagSection
        title={step?.title ?? "Tutorial"}
        description={`Step ${stepIndex + 1} of ${total}`}
      >
        <p className="text-sm leading-relaxed text-[var(--jag-text)]">
          {step?.body}
        </p>
      </JagSection>

      {tutorial.walkthroughId ? (
        <JagSection
          title="Interactive walkthrough"
          description="Guided highlights in the Command Center — complements the video."
        >
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              className="rounded border border-[var(--jag-border)] px-3 py-1.5 text-sm"
              onClick={() => {
                startTransition(async () => {
                  const wt = await walkthroughControlAction({
                    walkthroughId: tutorial.walkthroughId!,
                    action: "start",
                  });
                  if (wt.ok) setHighlight(wt.highlightControls);
                });
              }}
            >
              Start guide
            </button>
            <button
              type="button"
              disabled={pending}
              className="rounded border border-[var(--jag-border)] px-3 py-1.5 text-sm"
              onClick={() => {
                startTransition(async () => {
                  await walkthroughControlAction({
                    walkthroughId: tutorial.walkthroughId!,
                    action: "pause",
                  });
                });
              }}
            >
              Pause
            </button>
            <button
              type="button"
              disabled={pending}
              className="rounded border border-[var(--jag-border)] px-3 py-1.5 text-sm"
              onClick={() => {
                startTransition(async () => {
                  const wt = await walkthroughControlAction({
                    walkthroughId: tutorial.walkthroughId!,
                    action: "resume",
                  });
                  if (wt.ok) setHighlight(wt.highlightControls);
                });
              }}
            >
              Resume
            </button>
            <button
              type="button"
              disabled={pending}
              className="rounded border border-[var(--jag-border)] px-3 py-1.5 text-sm"
              onClick={() => {
                startTransition(async () => {
                  await walkthroughControlAction({
                    walkthroughId: tutorial.walkthroughId!,
                    action: "skip",
                  });
                  setHighlight([]);
                });
              }}
            >
              Skip
            </button>
          </div>
          {highlight.length > 0 ? (
            <p className="mt-3 text-xs text-[var(--jag-muted)]">
              Highlighting: {highlight.join(", ")}
            </p>
          ) : null}
        </JagSection>
      ) : null}

      <JagSection
        title="Progress"
        description="Step completion remains the source of truth."
      >
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending}
            className="rounded border border-[var(--jag-border-strong)] bg-[var(--jag-panel)] px-3 py-1.5 text-sm"
            onClick={() => {
              startTransition(async () => {
                if (!progress) {
                  const started = await startTutorialAction({
                    slug: tutorial.slug,
                  });
                  if (started.ok) setProgress(started.progress);
                }
                const next = await advanceTutorialAction({
                  slug: tutorial.slug,
                  direction: "next",
                });
                if (next.ok) setProgress(next.progress);
                if (tutorial.walkthroughId) {
                  const wt = await walkthroughControlAction({
                    walkthroughId: tutorial.walkthroughId,
                    action: progress ? "next" : "start",
                  });
                  if (wt.ok) setHighlight(wt.highlightControls);
                }
              });
            }}
          >
            Next
          </button>
          <button
            type="button"
            disabled={pending || stepIndex <= 0}
            className="rounded border border-[var(--jag-border)] px-3 py-1.5 text-sm"
            onClick={() => {
              startTransition(async () => {
                const prev = await advanceTutorialAction({
                  slug: tutorial.slug,
                  direction: "previous",
                });
                if (prev.ok) setProgress(prev.progress);
                if (tutorial.walkthroughId) {
                  const wt = await walkthroughControlAction({
                    walkthroughId: tutorial.walkthroughId,
                    action: "previous",
                    currentStepIndex: stepIndex,
                  });
                  if (wt.ok) setHighlight(wt.highlightControls);
                }
              });
            }}
          >
            Previous
          </button>
          <button
            type="button"
            disabled={pending}
            className="rounded border border-[var(--jag-border)] px-3 py-1.5 text-sm"
            onClick={() => {
              startTransition(async () => {
                const done = await completeTutorialAction({
                  slug: tutorial.slug,
                });
                if (done.ok) setProgress(done.progress);
              });
            }}
          >
            Mark complete
          </button>
        </div>
      </JagSection>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/jag/learn/tutorials" className="text-[var(--jag-muted)]">
          All tutorials
        </Link>
        <Link href="/jag/learn/coach" className="text-[var(--jag-muted)]">
          Ask JAG Coach
        </Link>
      </div>
    </div>
  );
}
