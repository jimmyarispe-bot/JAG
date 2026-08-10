"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { searchLearningHelpAction } from "@/lib/jag-command-center/learning/actions";
import { JagSection } from "../JagSection";

export function JagLearningHelp() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    readonly { slug: string; title: string; excerpt: string; href: string }[]
  >([]);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-6" data-jag-page="learn-help">
      <header className="space-y-2">
        <h1 className="font-[family-name:var(--font-jag-display)] text-2xl font-semibold text-[var(--jag-text)]">
          Help
        </h1>
        <p className="text-sm text-[var(--jag-muted)]">
          Search JAG product guidance. Results come from the Learning catalog —
          not internal repository documentation.
        </p>
      </header>

      <JagSection title="Search" description="Capability-filtered tutorials">
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(async () => {
              const res = await searchLearningHelpAction({ query });
              if (res.ok) setResults(res.results);
            });
          }}
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-w-[16rem] flex-1 rounded border border-[var(--jag-border)] bg-[var(--jag-bg)] px-3 py-2 text-sm"
            placeholder="Inbox, Decisions, Listening…"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded border border-[var(--jag-border-strong)] bg-[var(--jag-panel)] px-3 py-2 text-sm"
          >
            Search
          </button>
        </form>
        <ul className="mt-4 space-y-2">
          {results.map((r) => (
            <li key={r.slug}>
              <Link
                href={r.href}
                className="block rounded border border-[var(--jag-border)] px-3 py-2 hover:bg-[var(--jag-panel)]"
              >
                <p className="text-sm font-medium text-[var(--jag-text)]">
                  {r.title}
                </p>
                <p className="text-xs text-[var(--jag-muted)]">{r.excerpt}</p>
              </Link>
            </li>
          ))}
        </ul>
      </JagSection>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/jag/learn/coach" className="text-[var(--jag-muted)]">
          Ask JAG Coach
        </Link>
        <Link href="/jag/learn/tutorials" className="text-[var(--jag-muted)]">
          Tutorial library
        </Link>
      </div>
    </div>
  );
}
