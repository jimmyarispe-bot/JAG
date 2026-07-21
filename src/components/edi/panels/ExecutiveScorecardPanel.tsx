"use client";

import type { ExecutiveScorecard } from "@/lib/edi/types";
import { Metric } from "@/components/edi/panels/shared";

export function ExecutiveScorecardPanel({ scorecard }: { scorecard: ExecutiveScorecard }) {
  const items = [
    ["Financial Health", scorecard.financialHealth],
    ["Enrollment Health", scorecard.enrollmentHealth],
    ["Student Success", scorecard.studentSuccess],
    ["Teacher Effectiveness", scorecard.teacherEffectiveness],
    ["Compliance", scorecard.compliance],
    ["Growth", scorecard.growth],
    ["Parent Engagement", scorecard.parentEngagement],
    ["Operational Efficiency", scorecard.operationalEfficiency],
    ["Capacity", scorecard.capacity],
    ["Risk", scorecard.risk],
  ] as const;

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-brand-100 bg-brand-50 p-5">
        <p className="text-sm text-brand-700">Overall Enterprise Health</p>
        <p className="text-4xl font-bold text-brand-900">{scorecard.overallEnterpriseHealth}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {items.map(([label, value]) => (
          <Metric key={label} label={label} value={value} />
        ))}
      </div>
    </section>
  );
}
