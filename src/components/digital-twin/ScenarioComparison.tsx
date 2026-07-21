"use client";

import type { ScenarioComparison as Comparison } from "@/lib/platform/intelligence/digital-twin";

export function ScenarioComparison({ comparisons }: { comparisons: Comparison[] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white/80 p-4">
      <h2 className="text-sm font-semibold text-slate-900">Scenario comparison</h2>
      {comparisons.map((c, idx) => (
        <div key={idx} className="mt-3 space-y-2 text-sm">
          <p className="text-slate-700">{c.highlight}</p>
          <ul className="space-y-1 text-xs text-slate-600">
            {c.rows.slice(0, 4).map((r) => (
              <li key={r.metric}>
                {r.metric}: baseline {Number(r.baseline).toFixed(2)}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
