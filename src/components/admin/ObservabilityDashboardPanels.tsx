/**
 * RC-1 — server-rendered observability panels for /admin/performance.
 * Internal ops UI only; does not alter product UX.
 */

import type { ReactNode } from "react";
import type { ObservabilityDashboard } from "@/lib/observability";

export function ObservabilityDashboardPanels({
  data,
}: {
  data: ObservabilityDashboard;
}) {
  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-teal-700">
          RC-1 · Production observability
        </p>
        <h2 className="mt-1 text-lg font-semibold text-slate-900">
          Executive performance metrics
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Process-local telemetry for this instance. Wire OTLP for multi-instance aggregation.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="HTTP p50" value={`${data.percentiles.p50} ms`} />
        <Stat label="HTTP p95" value={`${data.percentiles.p95} ms`} />
        <Stat label="HTTP p99" value={`${data.percentiles.p99} ms`} />
        <Stat label="Active users" value={String(data.activeUsers)} />
        <Stat label="Error rate" value={String(data.errorRates.rate)} />
        <Stat
          label="Cache hit ratio"
          value={String(data.cache.hitRatio)}
        />
        <Stat label="DB p95" value={`${data.latency.database.p95} ms`} />
        <Stat
          label="Triggered alerts"
          value={String(data.triggeredAlerts.length)}
        />
      </div>

      <Panel title="Slowest routes">
        <SimpleTable
          headers={["Route", "Count", "p95", "p99"]}
          rows={data.slowestRoutes.map((r) => [
            r.route,
            String(r.count),
            `${r.p95} ms`,
            `${r.p99} ms`,
          ])}
        />
      </Panel>

      <Panel title="Slowest server actions">
        <SimpleTable
          headers={["Action", "Count", "p95", "max"]}
          rows={data.slowestActions.map((r) => [
            r.action,
            String(r.count),
            `${r.p95} ms`,
            `${r.max} ms`,
          ])}
        />
      </Panel>

      <Panel title="Slowest database queries">
        <SimpleTable
          headers={["Operation", "Table", "Duration", "OK"]}
          rows={data.slowestQueries.map((q) => [
            q.operation,
            q.table ?? "—",
            `${q.durationMs} ms`,
            q.ok ? "yes" : "no",
          ])}
        />
      </Panel>

      <Panel title="RUM by route">
        <SimpleTable
          headers={["Route", "Samples", "Avg LCP", "Avg INP", "Avg TTFB"]}
          rows={data.rum.byRoute.map((r) => [
            r.route,
            String(r.samples),
            String(r.avgLcp),
            String(r.avgInp),
            String(r.avgTtfb),
          ])}
        />
      </Panel>

      <Panel title="Alerts">
        <ul className="space-y-2 text-sm">
          {data.alerts.map((a) => (
            <li
              key={a.id}
              className={`rounded border px-3 py-2 ${
                a.triggered
                  ? "border-red-200 bg-red-50 text-red-900"
                  : "border-slate-100 bg-slate-50 text-slate-700"
              }`}
            >
              <span className="font-medium">{a.name}</span> — {a.detail}{" "}
              <span className="text-xs uppercase">({a.severity})</span>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Recent spans">
        <SimpleTable
          headers={["Name", "Duration", "Status", "Trace"]}
          rows={data.recentSpans.slice(0, 12).map((s) => [
            s.name,
            `${s.durationMs ?? "—"} ms`,
            s.status,
            s.traceId.slice(0, 12),
          ])}
        />
      </Panel>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function SimpleTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-slate-500">No samples yet in this process.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
          <tr>
            {headers.map((h) => (
              <th key={h} className="py-2 pr-3">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-slate-100 last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="py-2 pr-3">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
