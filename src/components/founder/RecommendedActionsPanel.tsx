import type { IntelligenceRecommendation, PrioritizedInsight } from "@/lib/platform/intelligence/executive-layer";

type RecommendedActionsPanelProps = {
  recommendations: IntelligenceRecommendation[];
  insightsById: Record<string, PrioritizedInsight | undefined>;
  organizationName: string | null;
};

export function RecommendedActionsPanel({
  recommendations,
  insightsById,
  organizationName,
}: RecommendedActionsPanelProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" aria-labelledby="actions-heading">
      <h2 id="actions-heading" className="text-lg font-semibold text-slate-900">
        Recommended Actions
      </h2>
      {recommendations.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">No recommendations at this time.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {recommendations.map((rec) => {
            const source = rec.insightIds
              .map((id) => insightsById[id]?.statement)
              .filter(Boolean)
              .join(" ");
            return (
              <li
                key={rec.id}
                className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold capitalize text-slate-700 ring-1 ring-slate-200">
                    {rec.priority}
                  </span>
                  <button
                    type="button"
                    disabled
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-400"
                    title="Action execution coming in a later sprint"
                  >
                    Take action
                  </button>
                </div>
                <p className="mt-2 text-sm font-medium text-slate-900">{rec.action}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Source: {source || "Linked insight"}
                </p>
                <p className="text-xs text-slate-500">
                  Organization: {organizationName ?? "Platform scope"}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
