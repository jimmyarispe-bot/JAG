"use client";

import Link from "next/link";
import type { LearningHomeModel } from "@/lib/jag-command-center/learning/client";
import { JagSection } from "../JagSection";

export function JagLearningHome({ model }: { readonly model: LearningHomeModel }) {
  return (
    <div className="space-y-8" data-jag-page="learn">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--jag-muted)]">
          Learning Center
        </p>
        <h1 className="font-[family-name:var(--font-jag-display)] text-2xl font-semibold tracking-tight text-[var(--jag-text)]">
          Learn The JAG™
        </h1>
        <p className="max-w-2xl text-sm text-[var(--jag-muted)]">
          Orientation, guided tutorials, and the JAG Coach for product usage —
          separate from Executive Conversation and platform provisioning.
        </p>
      </header>

      {model.continueLearning ? (
        <JagSection
          title="Continue learning"
          description="Pick up where you left off."
        >
          <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-[var(--jag-border)] bg-[var(--jag-panel)] px-4 py-3">
            <div>
              <p className="text-sm font-medium text-[var(--jag-text)]">
                {model.continueLearning.tutorial.title}
              </p>
              <p className="mt-1 text-xs text-[var(--jag-muted)]">
                {model.continueLearning.progress.progressPercent}% complete
              </p>
              <div className="mt-2 h-1.5 w-48 overflow-hidden rounded bg-[var(--jag-panel-2)]">
                <div
                  className="h-full bg-[var(--jag-ready)]"
                  style={{
                    width: `${model.continueLearning.progress.progressPercent}%`,
                  }}
                />
              </div>
            </div>
            <Link
              href={`/jag/learn/tutorials/${model.continueLearning.tutorial.slug}`}
              className="rounded border border-[var(--jag-border-strong)] bg-[var(--jag-panel-2)] px-3 py-1.5 text-sm text-[var(--jag-text)]"
            >
              Resume
            </Link>
          </div>
        </JagSection>
      ) : null}

      <JagSection
        title="Start Here"
        description="First-time orientation to The JAG™ Command Center."
      >
        <Link
          href="/jag/learn/start"
          className="inline-flex rounded border border-[var(--jag-border)] bg-[var(--jag-panel)] px-3 py-2 text-sm text-[var(--jag-text)] hover:border-[var(--jag-border-strong)]"
        >
          Begin orientation
        </Link>
      </JagSection>

      <JagSection
        title="Recommended for you"
        description="Based on the capabilities available in your workspace."
      >
        <ul className="grid gap-2 sm:grid-cols-2">
          {model.recommended.map((t) => (
            <li key={t.id}>
              <Link
                href={`/jag/learn/tutorials/${t.slug}`}
                className="block rounded border border-[var(--jag-border)] bg-[var(--jag-panel)] px-3 py-3 hover:border-[var(--jag-border-strong)]"
              >
                <p className="text-sm font-medium text-[var(--jag-text)]">
                  {t.title}
                </p>
                <p className="mt-1 text-xs text-[var(--jag-muted)]">
                  {t.estimatedMinutes} min · {t.code}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </JagSection>

      <JagSection
        title="JAG Essentials"
        description="Short tutorials for Command Center surfaces you can access."
      >
        <ul className="space-y-2">
          {model.essentials.map((t) => (
            <li key={t.id}>
              <Link
                href={`/jag/learn/tutorials/${t.slug}`}
                className="flex items-center justify-between rounded border border-[var(--jag-border)] px-3 py-2 text-sm text-[var(--jag-text)] hover:bg-[var(--jag-panel)]"
              >
                <span>{t.title}</span>
                <span className="text-xs text-[var(--jag-muted)]">
                  {t.estimatedMinutes} min
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-3">
          <Link
            href="/jag/learn/tutorials"
            className="text-sm text-[var(--jag-muted)] underline-offset-2 hover:underline"
          >
            View full tutorial library
          </Link>
        </div>
      </JagSection>

      <div className="grid gap-4 sm:grid-cols-2">
        <JagSection
          title="AI Coach"
          description="Ask how to use JAG — not organizational intelligence."
        >
          <Link
            href="/jag/learn/coach"
            className="inline-flex rounded border border-[var(--jag-border)] bg-[var(--jag-panel)] px-3 py-2 text-sm text-[var(--jag-text)]"
          >
            Ask the JAG Coach
          </Link>
        </JagSection>
        <JagSection
          title="Help"
          description="Search product guidance and open related tutorials."
        >
          <Link
            href="/jag/learn/help"
            className="inline-flex rounded border border-[var(--jag-border)] bg-[var(--jag-panel)] px-3 py-2 text-sm text-[var(--jag-text)]"
          >
            Open Help
          </Link>
        </JagSection>
      </div>
    </div>
  );
}
