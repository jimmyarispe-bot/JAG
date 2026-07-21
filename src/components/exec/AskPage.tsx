"use client";

import { useState } from "react";
import { askJagAction } from "@/app/exec/ask/actions";
import { DataModeBadge } from "@/components/exec/DataModeBadge";
import { WidgetFrame } from "@/components/exec/WidgetFrame";
import type { ExecAskViewModel } from "@/lib/exec/view-models";
import type { CopilotAskResult, SessionMemory } from "@/lib/platform/copilot";
import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";

type ChatRow = {
  id: string;
  role: "user" | "assistant";
  text: string;
  turn?: CopilotAskResult;
};

export function AskPage({ data }: { data: ExecAskViewModel }) {
  const [session, setSession] = useState<SessionMemory>(data.session);
  const [input, setInput] = useState("");
  const [rows, setRows] = useState<ChatRow[]>([
    {
      id: data.opener.id,
      role: "assistant",
      text: data.opener.answer,
      turn: data.opener,
    },
  ]);
  const [active, setActive] = useState<CopilotAskResult | null>(data.opener);
  const action = useActionFeedback({
    verb: "run",
    labels: { idle: "Ask", loading: "Analyzing…", success: "✓ Done" },
    successToast: "✓ Analysis ready.",
    errorToast: "Unable to complete analysis.",
    progressLabel: "Running executive analysis…",
  });

  function submit(question: string) {
    const q = question.trim();
    if (!q || action.isBusy) return;
    setInput("");
    setRows((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", text: q },
    ]);
    void action.run(async () => {
      const turn = await askJagAction({
        question: q,
        session,
        recommendationId: session.lastRecommendationId ?? undefined,
      });
      setSession(turn.memory);
      setActive(turn);
      setRows((prev) => [
        ...prev,
        { id: turn.id, role: "assistant", text: turn.answer, turn },
      ]);
      return turn;
    });
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Ask JAG</h1>
            <p className="mt-1 text-sm text-slate-500">
              Executive Copilot · {data.executiveRole} · {data.organizationId}
            </p>
          </div>
          <DataModeBadge mode={data.dataMode} />
        </div>

        <WidgetFrame
          widgetId="ask.brief"
          title="Morning snapshot"
          domains={["wisdom", "predictive", "oios-core"]}
          dataMode={data.dataMode}
        >
          <p className="text-sm font-medium text-slate-900">{data.brief.headline}</p>
          <dl className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
            <div>
              <dt className="font-semibold text-slate-500">Cash</dt>
              <dd>{data.brief.cash}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">Revenue</dt>
              <dd>{data.brief.revenue}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">Workforce</dt>
              <dd>{data.brief.workforce}</dd>
            </div>
          </dl>
        </WidgetFrame>

        <div className="rounded-2xl border border-slate-200 bg-white">
          <div className="max-h-[28rem] space-y-4 overflow-y-auto p-4">
            {rows.map((row) => (
              <div
                key={row.id}
                className={
                  row.role === "user"
                    ? "ml-8 rounded-xl bg-brand-50 px-3 py-2 text-sm text-slate-900"
                    : "mr-4 rounded-xl bg-slate-50 px-3 py-2 text-sm whitespace-pre-wrap text-slate-800"
                }
              >
                {row.text}
              </div>
            ))}
            {action.isBusy && (
              <p className="text-xs text-slate-500">Reasoning across connected systems…</p>
            )}
          </div>
          <form
            className="flex gap-2 border-t border-slate-100 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              submit(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask an executive question…"
              className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
              disabled={action.isBusy}
            />
            <ActionButton
              type="submit"
              status={action.status}
              verb="run"
              labels={{ idle: "Ask", loading: "Analyzing…", success: "✓ Done" }}
              className="!rounded-xl !px-4 !py-2 !text-sm"
              errorMessage={action.errorMessage}
            />
          </form>
          <div className="flex flex-wrap gap-2 border-t border-slate-100 px-3 py-3">
            {data.suggestedPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => submit(prompt)}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:border-brand-300 hover:text-brand-700"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <WidgetFrame
          widgetId="ask.evidence"
          title="Evidence chain"
          domains={["wisdom"]}
          dataMode={data.dataMode}
        >
          <p className="mb-2 text-[11px] uppercase tracking-wide text-slate-500">
            AcademyOS → QuickBooks → Square → Plaid → Workspace → Intelligence → Reasoning → Recommendation
          </p>
          <ul className="space-y-2 text-xs text-slate-700">
            {(active?.evidenceChain.links ?? []).map((link) => (
              <li key={link.id} className="border-b border-slate-100 pb-2 last:border-0">
                <span className="font-medium text-slate-900">
                  {link.grounded ? "●" : "○"} {link.system}
                </span>
                <p className="mt-0.5 text-slate-600">{link.statement}</p>
              </li>
            ))}
          </ul>
        </WidgetFrame>

        {active?.recommendation && (
          <WidgetFrame
            widgetId="ask.recommendation"
            title="Recommendation"
            domains={["wisdom", "opportunity"]}
            dataMode={data.dataMode}
          >
            <p className="text-sm font-medium text-slate-900">{active.recommendation.title}</p>
            <p className="mt-2 text-xs text-slate-600">{active.recommendation.executiveSummary}</p>
            <dl className="mt-3 space-y-2 text-xs text-slate-600">
              <div>
                <dt className="font-semibold text-slate-500">What to do</dt>
                <dd>{active.recommendation.suggestedAction}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">Confidence</dt>
                <dd>
                  {active.recommendation.confidence.level} (
                  {Math.round(active.recommendation.confidence.value * 100)}%)
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">Alternatives</dt>
                <dd>{active.recommendation.alternatives.join("; ")}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">Risks</dt>
                <dd>{active.recommendation.reasoning.risks.join("; ")}</dd>
              </div>
            </dl>
          </WidgetFrame>
        )}

        <WidgetFrame
          widgetId="ask.memory"
          title="Session memory"
          domains={["wisdom"]}
          dataMode={data.dataMode}
        >
          <p className="text-xs text-slate-600">Role: {session.executiveRole}</p>
          <p className="mt-1 text-xs text-slate-600">
            Recent: {session.recentQuestions.slice(0, 3).join(" · ") || "—"}
          </p>
          <p className="mt-1 text-xs text-slate-600">
            Pending: {session.pendingActions.slice(0, 3).join(" · ") || "—"}
          </p>
        </WidgetFrame>
      </div>
    </div>
  );
}
