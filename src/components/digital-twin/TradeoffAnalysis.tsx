"use client";

import { ActionChip } from "@/components/experience-system/feedback/ActionChip";
import type { TwinRecommendation } from "@/lib/platform/intelligence/digital-twin";

export function TradeoffAnalysis({ recommendation }: { recommendation: TwinRecommendation }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white/80 p-4">
      <h2 className="text-sm font-semibold text-slate-900">Trade-off analysis</h2>
      <p className="mt-1 text-sm text-slate-700">
        Preferred: {recommendation.preferredScenarioId ?? "none"} (advisory · no auto-execute)
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
        {recommendation.tradeOffs.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap gap-2">
        <ActionChip size="sm" variant="primary">
          View Evidence
        </ActionChip>
        <ActionChip size="sm" variant="outline">
          Compare
        </ActionChip>
      </div>
    </section>
  );
}
