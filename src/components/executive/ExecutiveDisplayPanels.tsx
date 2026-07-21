/**
 * P006 — Server-safe executive display panels (no client hooks).
 * Interactive forms remain in ExecutivePanels.tsx.
 */

import { formatCurrency } from "@/lib/format";
import type { NetworkDimensionRow, KpiRow, RiskItem } from "@/lib/executive/types";

export function NetworkDashboardPanel({ rows, title }: { rows: NetworkDimensionRow[]; title: string }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left">Dimension</th>
              <th className="px-3 py-2 text-right">Enrollment</th>
              <th className="px-3 py-2 text-right">Revenue</th>
              <th className="px-3 py-2 text-right">AR</th>
              <th className="px-3 py-2 text-right">Success</th>
              <th className="px-3 py-2 text-right">Staff</th>
              <th className="px-3 py-2 text-right">Pipeline</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={`${row.dimension}-${row.dimensionValue}`}>
                <td className="px-3 py-2 font-medium">{row.dimensionValue}</td>
                <td className="px-3 py-2 text-right">{row.enrollment}</td>
                <td className="px-3 py-2 text-right">{formatCurrency(row.revenue)}</td>
                <td className="px-3 py-2 text-right">{formatCurrency(row.outstandingAr)}</td>
                <td className="px-3 py-2 text-right">{row.avgSuccessScore ?? "—"}</td>
                <td className="px-3 py-2 text-right">{row.activeStaff}</td>
                <td className="px-3 py-2 text-right">{row.pipelineLeads}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function KpiCenterPanel({ kpis }: { kpis: KpiRow[] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="font-semibold">Strategic KPI Center</h2>
      {!kpis.length ? (
        <div className="mt-6 text-center">
          <p className="text-sm font-medium text-slate-900">No KPIs configured</p>
          <p className="mt-1 text-sm text-slate-500">
            KPI definitions appear here once strategic metrics are configured for this school.
          </p>
          <a
            href="/dashboard/executive/strategic"
            className="mt-4 inline-flex rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Open strategic goals
          </a>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left">KPI</th>
                <th className="px-3 py-2 text-left">Category</th>
                <th className="px-3 py-2 text-right">Actual</th>
                <th className="px-3 py-2 text-right">Target</th>
                <th className="px-3 py-2 text-right">Trend</th>
                <th className="px-3 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {kpis.map((k) => (
                <tr key={k.kpi_key}>
                  <td className="px-3 py-2 font-medium">{k.display_name}</td>
                  <td className="px-3 py-2 capitalize text-slate-500">{k.category}</td>
                  <td className="px-3 py-2 text-right">{formatKpiValue(k.actual_value, k.unit)}</td>
                  <td className="px-3 py-2 text-right">{formatKpiValue(k.target_value, k.unit)}</td>
                  <td className="px-3 py-2 text-right">
                    {k.trend_pct != null ? `${k.trend_pct > 0 ? "+" : ""}${k.trend_pct}%` : "—"}
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge status={k.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function RiskIntelligencePanel({ risks }: { risks: RiskItem[] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="font-semibold">Risk Intelligence</h2>
      <ul className="mt-4 space-y-3">
        {risks.map((r) => (
          <li key={r.id} className="rounded-xl border border-slate-100 p-4 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium">{r.title}</p>
                <p className="text-xs capitalize text-slate-500">
                  {r.risk_category.replace(/_/g, " ")} · {r.likelihood} likelihood · {r.impact} impact
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold">
                Score {r.risk_score}
              </span>
            </div>
            {r.recommended_action && (
              <p className="mt-2 text-slate-600">→ {r.recommended_action}</p>
            )}
          </li>
        ))}
        {!risks.length && <li className="text-slate-500">No open risks detected.</li>}
      </ul>
    </section>
  );
}

export function BoardReportingPanel({ schoolId }: { schoolId: string }) {
  const year = new Date().getFullYear();
  if (!schoolId) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
        <h2 className="font-semibold">Board Reporting Center</h2>
        <p className="text-sm text-slate-600">
          Assign a primary school to export board-ready CSV reports.
        </p>
        <a
          href="/dashboard/admin/organization"
          className="inline-flex rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Open organization settings
        </a>
      </section>
    );
  }
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
      <h2 className="font-semibold">Board Reporting Center</h2>
      <p className="text-sm text-slate-600">
        Export board-ready reports combining enrollment, financial performance, student outcomes,
        staffing, scholarships, state funding, and risk indicators.
      </p>
      <div className="flex flex-wrap gap-3">
        <a
          href={`/api/executive/board-export?schoolId=${schoolId}&from=${year}-01-01`}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          Download board CSV
        </a>
        <a
          href={`/api/finance/board-export?schoolId=${schoolId}&from=${year}-01-01`}
          className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          Finance detail CSV
        </a>
      </div>
      <p className="text-xs text-slate-500">
        CSV exports include enrollment, finance, outcomes, staffing, and risk indicators.
      </p>
    </section>
  );
}

export function BenchmarkingPanel({
  rows,
  metric,
}: {
  rows: {
    label: string;
    value: number;
    rank: number;
    networkAvg: number;
    vsNetworkPct: number | null;
  }[];
  metric: string;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="font-semibold capitalize">Benchmarking — {metric.replace(/_/g, " ")}</h2>
      {!rows.length ? (
        <p className="mt-4 text-sm text-slate-500">No benchmark rows for this metric yet.</p>
      ) : (
      <table className="mt-4 min-w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-3 py-2 text-left">Rank</th>
            <th className="px-3 py-2 text-left">Entity</th>
            <th className="px-3 py-2 text-right">Value</th>
            <th className="px-3 py-2 text-right">Network avg</th>
            <th className="px-3 py-2 text-right">vs network</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.label}>
              <td className="px-3 py-2">#{r.rank}</td>
              <td className="px-3 py-2 font-medium">{r.label}</td>
              <td className="px-3 py-2 text-right">{r.value}</td>
              <td className="px-3 py-2 text-right">{r.networkAvg}</td>
              <td className="px-3 py-2 text-right">
                {r.vsNetworkPct != null
                  ? `${r.vsNetworkPct > 0 ? "+" : ""}${r.vsNetworkPct}%`
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
    </section>
  );
}

function formatKpiValue(value: number | null, unit: string) {
  if (value == null) return "—";
  if (unit === "currency") return formatCurrency(value);
  if (unit === "percent") return `${value}%`;
  return String(value);
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    on_track: "bg-emerald-100 text-emerald-800",
    warning: "bg-amber-100 text-amber-800",
    critical: "bg-rose-100 text-rose-800",
    unknown: "bg-slate-100 text-slate-600",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs capitalize ${colors[status] ?? colors.unknown}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
