"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { JagConversationWorkspaceModel } from "@/lib/jag-command-center/conversation";
import type { JagConversationAnswer } from "@/lib/jag-command-center/conversation";
import {
  jagArchiveConversationAction,
  jagAskConversationAction,
  jagCreateConversationAction,
  jagPinConversationAction,
  jagRenameConversationAction,
} from "@/lib/jag-command-center/conversation";
import { JagChatSourcePanel } from "./JagChatSourcePanel";

export function JagChatView({
  model,
}: {
  readonly model: JagConversationWorkspaceModel;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [question, setQuestion] = useState("");
  const [streamText, setStreamText] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [localAnswer, setLocalAnswer] = useState<JagConversationAnswer | null>(
    model.active?.turns.filter((t) => t.role === "jag").at(-1)?.answer ?? null
  );
  const [sourceOpen, setSourceOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const conversationId = model.active?.id ?? null;
  const turns = model.active?.turns ?? [];

  const filteredConversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return model.conversations;
    return model.conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.preview.toLowerCase().includes(q)
    );
  }, [model.conversations, search]);

  async function ask(text: string) {
    const q = text.trim();
    if (!q || streaming || pending) return;
    setQuestion("");
    setStreaming(true);
    setStreamText("");
    setLocalAnswer(null);

    try {
      const res = await fetch("/api/jag/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          conversationId,
          organizationId: model.organizationId,
        }),
      });

      if (!res.ok || !res.body) {
        // Fallback to server action without stream
        const fallback = await jagAskConversationAction({
          question: q,
          conversationId,
          organizationId: model.organizationId,
        });
        if ("error" in fallback) {
          setStreamText(fallback.error ?? "Conversation request failed.");
        } else {
          setLocalAnswer(fallback.answer);
          setStreamText(fallback.answer.executiveSummary);
          router.replace(`/jag/chat?c=${fallback.conversationId}`);
          router.refresh();
        }
        setStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let nextId: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const msg = JSON.parse(line) as {
            type: string;
            text?: string;
            conversationId?: string;
            answer?: JagConversationAnswer;
          };
          if (msg.type === "meta") {
            nextId = msg.conversationId ?? null;
            if (msg.answer) setLocalAnswer(msg.answer);
          } else if (msg.type === "chunk" && msg.text) {
            setStreamText((prev) => (prev ? `${prev}\n\n${msg.text}` : msg.text!));
          }
        }
      }

      if (nextId) {
        router.replace(`/jag/chat?c=${nextId}`);
        router.refresh();
      }
    } catch {
      setStreamText("Conversation request failed. Retry with a suggested prompt.");
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] flex-col gap-0 border border-[var(--jag-border)] bg-[var(--jag-bg)] lg:flex-row">
      {/* History */}
      <aside className="flex w-full flex-col border-b border-[var(--jag-border)] lg:w-64 lg:border-b-0 lg:border-r">
        <div className="space-y-2 border-b border-[var(--jag-border)] px-3 py-3">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-sm font-medium text-[var(--jag-text)]">
              Conversation
            </h1>
            <button
              type="button"
              className="text-[11px] text-[var(--jag-muted)] hover:text-[var(--jag-text)]"
              onClick={() => {
                startTransition(async () => {
                  const created = await jagCreateConversationAction({
                    organizationId: model.organizationId,
                    organizationName: model.organizationName,
                  });
                  if ("conversation" in created && created.conversation) {
                    router.push(`/jag/chat?c=${created.conversation.id}`);
                    router.refresh();
                  }
                });
              }}
            >
              New
            </button>
          </div>
          <p className="text-[11px] leading-relaxed text-[var(--jag-muted)]">
            {model.advisoryNotice}
          </p>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations"
            className="w-full rounded border border-[var(--jag-border)] bg-[var(--jag-panel)] px-2 py-1.5 text-xs text-[var(--jag-text)] outline-none focus:border-[var(--jag-border-strong)]"
          />
        </div>
        <ul className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <li className="px-3 py-4 text-xs text-[var(--jag-muted)]">
              No conversations yet.
            </li>
          ) : (
            filteredConversations.map((c) => (
              <li key={c.id} className="border-b border-[var(--jag-border)]">
                <Link
                  href={`/jag/chat?c=${c.id}`}
                  className={`block px-3 py-2 text-xs hover:bg-[var(--jag-panel)] ${
                    c.id === conversationId ? "bg-[var(--jag-panel)]" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium text-[var(--jag-text)]">
                      {c.pinned ? "Pinned · " : ""}
                      {c.title}
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-[var(--jag-muted)]">
                    {c.preview}
                  </p>
                </Link>
                {c.id === conversationId ? (
                  <div className="flex flex-wrap gap-2 px-3 pb-2 text-[10px] text-[var(--jag-muted)]">
                    <button
                      type="button"
                      onClick={() => {
                        setRenameId(c.id);
                        setRenameValue(c.title);
                      }}
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        startTransition(async () => {
                          await jagPinConversationAction({
                            id: c.id,
                            pinned: !c.pinned,
                          });
                          router.refresh();
                        })
                      }
                    >
                      {c.pinned ? "Unpin" : "Pin"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        startTransition(async () => {
                          await jagArchiveConversationAction({
                            id: c.id,
                            archived: true,
                          });
                          router.push("/jag/chat");
                          router.refresh();
                        })
                      }
                    >
                      Archive
                    </button>
                  </div>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </aside>

      {/* Thread */}
      <section className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-[var(--jag-border)] px-4 py-3">
          <p className="text-xs text-[var(--jag-muted)]">
            {model.organizationName
              ? `Grounded to ${model.organizationName}`
              : "No organization selected"}
            {" · "}
            <Link href="/jag" className="hover:text-[var(--jag-text)]">
              Overview
            </Link>
            {" · "}
            <Link href="/jag/decisions" className="hover:text-[var(--jag-text)]">
              Decisions
            </Link>
            {" · "}
            <Link href="/jag/scenarios" className="hover:text-[var(--jag-text)]">
              Scenarios
            </Link>
          </p>
          {renameId ? (
            <form
              className="mt-2 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                startTransition(async () => {
                  await jagRenameConversationAction({
                    id: renameId,
                    title: renameValue,
                  });
                  setRenameId(null);
                  router.refresh();
                });
              }}
            >
              <input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="flex-1 rounded border border-[var(--jag-border)] bg-[var(--jag-panel)] px-2 py-1 text-xs"
              />
              <button type="submit" className="text-xs text-[var(--jag-text)]">
                Save
              </button>
            </form>
          ) : null}
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {turns.length === 0 && !streamText ? (
            <div className="space-y-3">
              <p className="text-sm text-[var(--jag-muted)]">
                Ask an executive question. Answers cite Decision Center,
                Forecasts, Scenarios, Briefings, and bound contributor evidence
                only.
              </p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {model.suggestedPrompts.map((p) => (
                  <li key={p}>
                    <button
                      type="button"
                      onClick={() => void ask(p)}
                      className="w-full rounded border border-[var(--jag-border)] bg-[var(--jag-panel)] px-3 py-2 text-left text-xs text-[var(--jag-text)] hover:border-[var(--jag-border-strong)]"
                    >
                      {p}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {turns.map((turn) => (
            <article
              key={turn.id}
              className={`rounded-md border border-[var(--jag-border)] px-3 py-2 text-xs ${
                turn.role === "executive"
                  ? "bg-[var(--jag-bg)]"
                  : "bg-[var(--jag-panel)]"
              }`}
            >
              <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted-2)]">
                {turn.role === "executive" ? "Executive" : "The JAG™"}
                {turn.intent ? ` · ${turn.intent.replace(/_/g, " ")}` : ""}
                {typeof turn.durationMs === "number"
                  ? ` · ${turn.durationMs}ms`
                  : ""}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-[var(--jag-text)]">
                {turn.content}
              </p>
              {turn.answer ? (
                <AnswerBody
                  answer={turn.answer}
                  onOpenSources={() => {
                    setLocalAnswer(turn.answer!);
                    setSourceOpen(true);
                  }}
                />
              ) : null}
            </article>
          ))}

          {streaming || streamText ? (
            <article className="rounded-md border border-[var(--jag-border)] bg-[var(--jag-panel)] px-3 py-2 text-xs">
              <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted-2)]">
                JAG {streaming ? "· streaming" : ""}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-[var(--jag-text)]">
                {streamText || "Grounding answer…"}
              </p>
              {localAnswer && !streaming ? (
                <AnswerBody
                  answer={localAnswer}
                  onOpenSources={() => setSourceOpen(true)}
                />
              ) : null}
            </article>
          ) : null}
        </div>

        <form
          className="border-t border-[var(--jag-border)] p-3"
          onSubmit={(e) => {
            e.preventDefault();
            void ask(question);
          }}
        >
          <div className="flex gap-2">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about decisions, health, forecasts, scenarios…"
              className="flex-1 rounded border border-[var(--jag-border)] bg-[var(--jag-panel)] px-3 py-2 text-sm text-[var(--jag-text)] outline-none focus:border-[var(--jag-border-strong)]"
              disabled={streaming}
            />
            <button
              type="submit"
              disabled={streaming || !question.trim()}
              className="rounded border border-[var(--jag-border-strong)] px-3 py-2 text-xs text-[var(--jag-text)] disabled:opacity-40"
            >
              Ask
            </button>
            <button
              type="button"
              onClick={() => setSourceOpen((v) => !v)}
              className="rounded border border-[var(--jag-border)] px-3 py-2 text-xs text-[var(--jag-muted)]"
            >
              Sources
            </button>
          </div>
        </form>
      </section>

      <JagChatSourcePanel
        answer={localAnswer}
        open={sourceOpen}
        onClose={() => setSourceOpen(false)}
      />
    </div>
  );
}

function AnswerBody({
  answer,
  onOpenSources,
}: {
  answer: JagConversationAnswer;
  onOpenSources: () => void;
}) {
  return (
    <div className="mt-3 space-y-3 border-t border-[var(--jag-border)] pt-3">
      <p className="text-[10px] text-[var(--jag-muted-2)]">{answer.advisoryNotice}</p>
      <Meta
        label="Confidence"
        value={`${(answer.confidence * 100).toFixed(0)}% · ${answer.confidenceBand}`}
      />
      <LinkGroup title="Evidence" links={answer.evidence.map((e) => ({
        id: e.id,
        label: e.source,
        href: e.href ?? "#",
      }))} />
      <LinkGroup title="Decisions" links={answer.relatedDecisions} />
      <LinkGroup title="Forecasts" links={answer.forecasts} />
      <LinkGroup title="Scenarios" links={answer.scenarios} />
      <LinkGroup title="Policies" links={answer.relatedPolicies} />
      <LinkGroup title="Knowledge" links={answer.relatedKnowledge} />
      <StringGroup title="Primary drivers" items={answer.primaryDrivers.map((d) => d.label)} />
      <StringGroup title="Contributors" items={answer.supportingContributors} />
      <StringGroup title="Recommended next actions" items={answer.recommendedNextActions} />
      <StringGroup title="Suggested follow-ups" items={answer.suggestedFollowUps} />
      <button
        type="button"
        onClick={onOpenSources}
        className="text-[11px] text-[var(--jag-muted)] underline-offset-2 hover:text-[var(--jag-text)] hover:underline"
      >
        Open source panel
      </button>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-[11px] text-[var(--jag-muted)]">
      <span className="text-[var(--jag-muted-2)]">{label}: </span>
      <span className="font-[family-name:var(--font-jag-mono)] text-[var(--jag-text)]">
        {value}
      </span>
    </p>
  );
}

function LinkGroup({
  title,
  links,
}: {
  title: string;
  links: readonly { id: string; label: string; href: string }[];
}) {
  if (links.length === 0) return null;
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted)]">
        {title}
      </p>
      <ul className="mt-1 space-y-0.5">
        {links.map((l) => (
          <li key={l.id}>
            {l.href && l.href !== "#" ? (
              <Link
                href={l.href}
                className="text-[var(--jag-text)] underline-offset-2 hover:underline"
              >
                {l.label}
              </Link>
            ) : (
              <span className="text-[var(--jag-muted)]">{l.label}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function StringGroup({
  title,
  items,
}: {
  title: string;
  items: readonly string[];
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted)]">
        {title}
      </p>
      <ul className="mt-1 space-y-0.5 text-[var(--jag-muted)]">
        {items.map((item) => (
          <li key={item}>– {item}</li>
        ))}
      </ul>
    </div>
  );
}
