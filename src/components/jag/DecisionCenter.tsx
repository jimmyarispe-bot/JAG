import type { DecisionIntelligenceResult } from "@/lib/platform/intelligence/decision/types";

interface DecisionCenterProps {
  decision: DecisionIntelligenceResult | null;
}

export function DecisionCenter({ decision }: DecisionCenterProps) {
  return (
    <section id="active-decisions" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" data-stream-ready="true">
      <h2 className="text-lg font-semibold text-slate-900">Active Decisions</h2>
      {!decision ? (
        <p className="mt-2 text-sm text-slate-500">No decision package for this cycle.</p>
      ) : (
        <div className="mt-3 space-y-3" id={`decision-${decision.requestId}`}>
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Question</p>
            <p className="mt-1 text-sm text-slate-800">{decision.analysis.decisionQuestion}</p>
          </div>
          <div className="rounded-xl border border-brand-100 bg-brand-50/40 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Recommendation</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{decision.recommendation.recommendedOption}</p>
            <p className="mt-1 text-sm text-slate-600">{decision.recommendation.expectedValue}</p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-600">
              {decision.recommendation.rationale.slice(0, 4).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-100 px-3 py-2">
              <p className="text-xs text-slate-500">Approval</p>
              <p className="text-sm font-medium text-slate-900">{decision.approval.status}</p>
            </div>
            <div className="rounded-xl border border-slate-100 px-3 py-2">
              <p className="text-xs text-slate-500">Impact</p>
              <p className="text-sm font-medium text-slate-900">{decision.impact.overallScore}</p>
            </div>
          </div>
          <p className="text-sm text-slate-600">{decision.brief.narrative}</p>
        </div>
      )}
    </section>
  );
}
