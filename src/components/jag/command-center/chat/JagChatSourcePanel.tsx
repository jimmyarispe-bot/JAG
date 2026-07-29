"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { JagConversationAnswer } from "@/lib/jag-command-center/conversation";

export function JagChatSourcePanel({
  answer,
  open,
  onClose,
}: {
  readonly answer: JagConversationAnswer | null;
  readonly open: boolean;
  readonly onClose: () => void;
}) {
  if (!open) return null;

  return (
    <aside className="flex w-full max-w-md flex-col border-l border-[var(--jag-border)] bg-[var(--jag-panel)] lg:min-h-0">
      <div className="flex items-center justify-between border-b border-[var(--jag-border)] px-4 py-3">
        <h2 className="text-sm font-medium text-[var(--jag-text)]">Sources</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-[var(--jag-muted)] hover:text-[var(--jag-text)]"
        >
          Close
        </button>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-3 text-xs">
        {!answer ? (
          <p className="text-[var(--jag-muted)]">
            Select a JAG answer to inspect evidence, timeline, and traces.
          </p>
        ) : (
          <>
            <Block title="Confidence explanation">
              <p className="text-[var(--jag-muted)]">
                {answer.confidenceExplanation}
              </p>
              <p className="mt-1 font-[family-name:var(--font-jag-mono)] text-[var(--jag-text)]">
                {(answer.confidence * 100).toFixed(0)}% · {answer.confidenceBand}
              </p>
            </Block>

            <Block title="Evidence">
              <EntityList
                items={answer.evidence.map((e) => ({
                  id: e.id,
                  label: e.source,
                  detail: e.summary,
                  href: e.href,
                }))}
              />
            </Block>

            <Block title="Timeline">
              {answer.timeline.length === 0 ? (
                <Empty />
              ) : (
                <ul className="space-y-2">
                  {answer.timeline.map((t) => (
                    <li key={`${t.at}-${t.message}`}>
                      <p className="font-[family-name:var(--font-jag-mono)] text-[10px] text-[var(--jag-muted-2)]">
                        {t.at}
                      </p>
                      <p className="text-[var(--jag-muted)]">{t.message}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Block>

            <Block title="Policy trace">
              <StringList items={answer.policyTrace} />
            </Block>

            <Block title="Contributor trace">
              <StringList items={answer.contributorTrace} />
            </Block>

            <Block title="Dependencies">
              <StringList items={answer.dependencies} />
            </Block>

            <Block title="Reasoning chain">
              <StringList items={answer.reasoningChain} />
            </Block>
          </>
        )}
      </div>
    </aside>
  );
}

function Block({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h3 className="text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--jag-muted)]">
        {title}
      </h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function Empty() {
  return <p className="text-[var(--jag-muted)]">None bound.</p>;
}

function StringList({ items }: { items: readonly string[] }) {
  if (items.length === 0) return <Empty />;
  return (
    <ul className="space-y-1 text-[var(--jag-muted)]">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="text-[var(--jag-muted-2)]">–</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function EntityList({
  items,
}: {
  items: readonly {
    id: string;
    label: string;
    detail: string;
    href?: string;
  }[];
}) {
  if (items.length === 0) return <Empty />;
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id}>
          {item.href ? (
            <Link
              href={item.href}
              className="text-[var(--jag-text)] underline-offset-2 hover:underline"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-[var(--jag-text)]">{item.label}</span>
          )}
          <p className="mt-0.5 text-[var(--jag-muted)]">{item.detail}</p>
        </li>
      ))}
    </ul>
  );
}
