import { ObservabilityDashboardPanels } from "@/components/admin/ObservabilityDashboardPanels";
import { PerformanceHydrationMeter } from "@/components/admin/PerformanceHydrationMeter";
import { buildObservabilityDashboard } from "@/lib/observability";
import {
  getRecentPerformanceSnapshot,
  runPerformanceProbe,
} from "@/lib/performance";

export const metadata = {
  title: "Performance · Admin · JAG",
  description: "RC-1 — ECC performance measurement + production observability",
};

export const dynamic = "force-dynamic";

export default async function AdminPerformancePage() {
  const report = await runPerformanceProbe();
  const recent = getRecentPerformanceSnapshot();
  const observability = buildObservabilityDashboard();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <p className="text-xs font-medium uppercase tracking-wide text-teal-700">
            RC-1 · Production readiness
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">Performance</h1>
          <p className="mt-1 text-sm text-slate-500">
            Measure before optimize — Executive Command Center load path + live
            observability. Generated {new Date(report.generatedAt).toLocaleString()}.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        <ObservabilityDashboardPanels data={observability} />

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="App route files"
            value={String(report.routeInventory.appRouteFiles)}
          />
          <Stat label="ECC routes" value={String(report.routeInventory.execRoutes)} />
          <Stat
            label="Cache hits (probe)"
            value={String(recent.totals.cacheHits)}
          />
          <Stat
            label="Cache misses (probe)"
            value={String(recent.totals.cacheMisses)}
          />
        </section>

        <PerformanceHydrationMeter route="/admin/performance" />

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-800">Cold vs warm (proven gap)</h2>
          <p className="mt-1 text-sm text-slate-500">
            Process singletons eliminate repeated DI / connector bootstrap after first request.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2 pr-4">Subsystem</th>
                  <th className="py-2 pr-4">Cold</th>
                  <th className="py-2 pr-4">Warm</th>
                  <th className="py-2">Singleton init</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="py-2 pr-4">Intelligence DI</td>
                  <td className="py-2 pr-4">{report.comparisons.intelligenceColdMs} ms</td>
                  <td className="py-2 pr-4">{report.comparisons.intelligenceWarmMs} ms</td>
                  <td className="py-2">
                    {report.singletons.intelligenceInitMs ?? "—"} ms
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Integrations bootstrap</td>
                  <td className="py-2 pr-4">{report.comparisons.integrationsColdMs} ms</td>
                  <td className="py-2 pr-4">{report.comparisons.integrationsWarmMs} ms</td>
                  <td className="py-2">
                    {report.singletons.integrationsInitMs ?? "—"} ms
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-800">Route timing report</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2 pr-3">Route</th>
                  <th className="py-2 pr-3">Total</th>
                  <th className="py-2 pr-3">Intelligence</th>
                  <th className="py-2 pr-3">Integrations</th>
                  <th className="py-2 pr-3">Sync</th>
                  <th className="py-2 pr-3">Loader</th>
                  <th className="py-2">Org resolve</th>
                </tr>
              </thead>
              <tbody>
                {report.routeTimings.map((row) => (
                  <tr key={row.route} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 pr-3">
                      <span className="font-medium text-slate-900">{row.label}</span>
                      <span className="block text-xs text-slate-500">{row.route}</span>
                    </td>
                    <td className="py-2 pr-3 font-medium">{row.totalMs} ms</td>
                    <td className="py-2 pr-3">{row.intelligenceMs} ms</td>
                    <td className="py-2 pr-3">{row.integrationsMs} ms</td>
                    <td className="py-2 pr-3">{row.syncMs} ms</td>
                    <td className="py-2 pr-3">{row.buildMs} ms</td>
                    <td className="py-2">{row.orgResolutionMs} ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-800">Bottleneck detections</h2>
          <ul className="mt-4 space-y-3">
            {report.detections.map((d) => (
              <li key={d.id} className="rounded-md border border-slate-100 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <SeverityBadge severity={d.severity} />
                  <p className="font-medium text-slate-900">{d.title}</p>
                </div>
                <p className="mt-1 text-sm text-slate-600">{d.evidence}</p>
                <p className="mt-1 text-sm text-teal-800">→ {d.recommendation}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-800">Bundle report</h2>
          <ul className="mt-4 space-y-3">
            {report.bundle.map((row) => (
              <li key={row.area} className="text-sm">
                <p className="font-medium text-slate-900">{row.area}</p>
                <p className="text-slate-600">
                  Client components: {row.clientComponentCount} · {row.serverComponentHint}
                </p>
                <p className="text-slate-500">{row.notes}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-slate-500">
            ECC client components scanned: {report.routeInventory.execClientComponents} · server-ish
            files: {report.routeInventory.execServerComponents}
          </p>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-800">Recent traces</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {recent.traces.slice(0, 8).map((t) => (
              <li key={t.id} className="flex justify-between gap-4 border-b border-slate-100 py-2">
                <span>
                  {t.label}{" "}
                  <span className="text-xs text-slate-500">{t.route}</span>
                </span>
                <span className="font-medium">{t.totalMs} ms</span>
              </li>
            ))}
          </ul>
        </section>

        <p className="text-xs text-slate-500">
          Ops guide: <code>docs/operations/phase-f/13_MONITORING_AND_OPERATIONS.md</code>. Endpoints:{" "}
          <code>/api/health</code>, <code>/api/ready</code>, <code>/api/ready/deep</code>,{" "}
          <code>/api/observability/metrics</code>, <code>/api/observability/alerts</code>.
        </p>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function SeverityBadge({
  severity,
}: {
  severity: "critical" | "high" | "medium" | "low";
}) {
  const styles: Record<typeof severity, string> = {
    critical: "bg-red-100 text-red-800",
    high: "bg-orange-100 text-orange-800",
    medium: "bg-amber-100 text-amber-800",
    low: "bg-slate-100 text-slate-700",
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${styles[severity]}`}>
      {severity}
    </span>
  );
}
