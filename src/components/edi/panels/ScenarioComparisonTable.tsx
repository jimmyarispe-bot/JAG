"use client";

import { formatCurrency } from "@/lib/format";

export function ScenarioComparisonTable({
  scenarios,
}: {
  scenarios: Array<{
    id: string;
    name: string;
    scenario_type: string;
    edi_scenario_results?: Array<Record<string, unknown>>;
  }>;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Scenario</th>
            <th className="px-4 py-3">Revenue</th>
            <th className="px-4 py-3">EBITDA</th>
            <th className="px-4 py-3">Enrollment</th>
            <th className="px-4 py-3">Margin %</th>
            <th className="px-4 py-3">Cash flow</th>
          </tr>
        </thead>
        <tbody>
          {scenarios.map((s) => {
            const r = s.edi_scenario_results?.[0];
            return (
              <tr key={s.id} className="border-b border-slate-50">
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3">{r ? formatCurrency(Number(r.projected_revenue)) : "—"}</td>
                <td className="px-4 py-3">{r ? formatCurrency(Number(r.projected_ebitda)) : "—"}</td>
                <td className="px-4 py-3">{r ? Number(r.projected_enrollment).toFixed(0) : "—"}</td>
                <td className="px-4 py-3">{r ? `${Number(r.projected_margin_pct).toFixed(1)}%` : "—"}</td>
                <td className="px-4 py-3">{r ? formatCurrency(Number(r.projected_cash_flow)) : "—"}</td>
              </tr>
            );
          })}
          {!scenarios.length && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-slate-500">No scenarios computed yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
