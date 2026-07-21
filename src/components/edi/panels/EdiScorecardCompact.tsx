"use client";

import type { ExecutiveScorecard } from "@/lib/edi/types";

export function EdiScorecardCompact({ scorecard }: { scorecard: ExecutiveScorecard }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Executive Scorecard</h2>
        <span className="text-2xl font-bold text-brand-700">{scorecard.overallEnterpriseHealth}</span>
      </div>
      <p className="mt-1 text-xs text-slate-500">Rules-based enterprise health — not AI</p>
    </section>
  );
}
