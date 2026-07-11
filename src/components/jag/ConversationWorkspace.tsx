"use client";

import { useState, useTransition } from "react";
import type { ExecutiveWorkspaceLinks } from "@/lib/platform/jag/workspace";
import type { JagModeratedRecommendation } from "@/lib/platform/jag/collaboration/types";
import type { OrganizationExecutiveBrief } from "@/lib/platform/intelligence/organization/types";

interface ConversationWorkspaceProps {
  brief: OrganizationExecutiveBrief | null;
  recommendations: readonly JagModeratedRecommendation[];
  links: ExecutiveWorkspaceLinks;
  consensusSummary: string | null;
}

interface ConversationTurn {
  id: string;
  role: "jag" | "executive";
  body: string;
  recommendationKey?: string;
}

function ContextLinks({ links }: { links: ExecutiveWorkspaceLinks }) {
  const chips = [
    links.evidenceIds[0] ? { href: `#evidence-${links.evidenceIds[0]}`, label: "Evidence" } : null,
    links.memoryIds[0] ? { href: `#memory-${links.memoryIds[0]}`, label: "Memory" } : null,
    links.goalIds[0] ? { href: `#goal-${links.goalIds[0]}`, label: "Goals" } : null,
    links.executionIds[0]
      ? { href: `#execution-${links.executionIds[0]}`, label: "Execution" }
      : null,
    links.decisionId ? { href: `#decision-${links.decisionId}`, label: "Decision history" } : null,
    links.organizationRequestId
      ? { href: "#organization-map", label: "Organization context" }
      : null,
  ].filter((chip): chip is { href: string; label: string } => chip !== null);

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {chips.map((chip) => (
        <a
          key={chip.label}
          href={chip.href}
          className="rounded-md bg-white/80 px-2 py-0.5 text-[11px] font-medium text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50"
        >
          {chip.label}
        </a>
      ))}
    </div>
  );
}

export function ConversationWorkspace({
  brief,
  recommendations,
  links,
  consensusSummary,
}: ConversationWorkspaceProps) {
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState("");
  const [turns, setTurns] = useState<ConversationTurn[]>(() => {
    const opener: ConversationTurn = {
      id: "open",
      role: "jag",
      body:
        brief?.narrative ??
        consensusSummary ??
        "JAG is ready. Ask about health, goals, decisions, or recommendations.",
    };
    const recTurns: ConversationTurn[] = recommendations.slice(0, 5).map((rec) => ({
      id: rec.recommendationKey,
      role: "jag",
      body: `${rec.title}: ${rec.summary}`,
      recommendationKey: rec.recommendationKey,
    }));
    return [opener, ...recTurns];
  });

  function submit() {
    const text = draft.trim();
    if (!text) return;
    startTransition(() => {
      setTurns((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, role: "executive", body: text },
        {
          id: `jag-${Date.now()}`,
          role: "jag",
          body:
            "Streaming responses will attach here. For now, use the linked panels — evidence, memory, goals, execution, decisions, and organization context — for this cycle’s intelligence.",
        },
      ]);
      setDraft("");
    });
  }

  return (
    <section
      id="conversation-workspace"
      className="rounded-2xl border border-brand-200/70 bg-gradient-to-b from-brand-50/60 to-white p-6 shadow-sm"
      data-stream-ready="true"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">Primary interface</p>
          <h2 className="text-lg font-semibold text-slate-900">Conversation Workspace</h2>
        </div>
        <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-slate-500 ring-1 ring-slate-200">
          Stream-ready
        </span>
      </div>

      <div className="mt-4 max-h-[28rem] space-y-3 overflow-y-auto rounded-xl bg-white/70 p-3 ring-1 ring-slate-100">
        {turns.map((turn) => (
          <div
            key={turn.id}
            className={
              turn.role === "jag"
                ? "rounded-xl bg-brand-50/80 px-3 py-2.5 text-sm text-slate-800"
                : "ml-6 rounded-xl bg-slate-900 px-3 py-2.5 text-sm text-white"
            }
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">
              {turn.role === "jag" ? "JAG" : "You"}
            </p>
            <p className="mt-1 leading-relaxed">{turn.body}</p>
            {turn.role === "jag" && <ContextLinks links={links} />}
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") submit();
          }}
          placeholder="Ask JAG about alerts, goals, decisions…"
          className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-brand-500 focus:ring-2"
          disabled={pending}
        />
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          Send
        </button>
      </div>
    </section>
  );
}
