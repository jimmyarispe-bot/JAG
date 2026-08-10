"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import type { JagLearnCoachAnswer } from "@/lib/jag-command-center/learning/client";
import { askLearningCoachAction } from "@/lib/jag-command-center/learning/actions";
import { JagSection } from "../JagSection";

export function JagLearningCoach() {
  const pathname = usePathname();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<JagLearnCoachAnswer | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-6" data-jag-page="learn-coach">
      <header className="space-y-2">
        <h1 className="font-[family-name:var(--font-jag-display)] text-2xl font-semibold text-[var(--jag-text)]">
          JAG Coach
        </h1>
        <p className="max-w-2xl text-sm text-[var(--jag-muted)]">
          Product guidance for The JAG™ — navigation, tutorials, and “how do I
          use…?” questions. For organizational intelligence, use{" "}
          <Link href="/jag/chat" className="underline underline-offset-2">
            Executive Conversation
          </Link>
          .
        </p>
      </header>

      <JagSection title="Ask the Coach" description="Rule-based · capability-aware">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(async () => {
              const result = await askLearningCoachAction({
                question,
                pathname,
              });
              if (result.ok) setAnswer(result.answer);
            });
          }}
        >
          <label className="block text-xs text-[var(--jag-muted)]" htmlFor="coach-q">
            Question
          </label>
          <textarea
            id="coach-q"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            className="w-full rounded border border-[var(--jag-border)] bg-[var(--jag-bg)] px-3 py-2 text-sm text-[var(--jag-text)]"
            placeholder="Where do I find Decisions? What should I learn next?"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded border border-[var(--jag-border-strong)] bg-[var(--jag-panel)] px-3 py-1.5 text-sm text-[var(--jag-text)]"
          >
            {pending ? "Thinking…" : "Ask"}
          </button>
        </form>
      </JagSection>

      {answer ? (
        <JagSection title="Guidance" description="From the JAG Learning catalog">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--jag-text)]">
            {answer.answer}
          </p>
          {answer.deepLinks.length > 0 ? (
            <ul className="mt-3 space-y-1">
              {answer.deepLinks.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--jag-muted)] underline-offset-2 hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </JagSection>
      ) : null}
    </div>
  );
}
