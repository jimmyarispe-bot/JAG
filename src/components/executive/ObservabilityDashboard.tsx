import type { ProductionObservabilitySnapshot } from "@/lib/production";

interface ObservabilityDashboardProps {
  snapshot: ProductionObservabilitySnapshot;
}

export function ObservabilityDashboard({ snapshot }: ObservabilityDashboardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Production Observability</h2>
        <p className="mt-1 text-sm text-slate-600">
          Pipeline latency, workflow health, queue depth, integration status, and release score.
          Generated {new Date(snapshot.generatedAt).toLocaleString()}.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {snapshot.metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-xl border border-slate-200 bg-white p-4"
          >
            <p className="text-xs uppercase tracking-wide text-slate-500">{m.label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {m.value}
              {m.unit ? (
                <span className="ml-1 text-sm font-normal text-slate-500">{m.unit}</span>
              ) : null}
            </p>
            {m.hint ? <p className="mt-1 text-xs text-slate-500">{m.hint}</p> : null}
          </div>
        ))}
      </div>

      <section aria-labelledby="release-health-heading" className="space-y-3">
        <h3 id="release-health-heading" className="text-sm font-semibold text-slate-800">
          Release health
        </h3>
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            snapshot.releaseHealth.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-rose-200 bg-rose-50 text-rose-900"
          }`}
          role="status"
        >
          Aggregate score {snapshot.releaseHealth.overallScore} · pass{" "}
          {snapshot.releaseHealth.pass} · warn {snapshot.releaseHealth.warn} · fail{" "}
          {snapshot.releaseHealth.fail}
        </div>
      </section>

      <section aria-labelledby="integration-health-heading" className="space-y-3">
        <h3 id="integration-health-heading" className="text-sm font-semibold text-slate-800">
          Priority integrations
        </h3>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <caption className="sr-only">
              Extension-registered priority integrations and configuration status
            </caption>
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2" scope="col">
                  Provider
                </th>
                <th className="px-3 py-2" scope="col">
                  Registered
                </th>
                <th className="px-3 py-2" scope="col">
                  Configured
                </th>
                <th className="px-3 py-2" scope="col">
                  Capabilities
                </th>
              </tr>
            </thead>
            <tbody>
              {snapshot.integrationHealth.map((row) => (
                <tr key={row.id} className="border-b border-slate-100">
                  <td className="px-3 py-2 font-medium text-slate-900">{row.name}</td>
                  <td className="px-3 py-2">{row.registered ? "Yes" : "No"}</td>
                  <td className="px-3 py-2">{row.configured ? "Yes" : "Env pending"}</td>
                  <td className="px-3 py-2 text-slate-600">
                    {row.capabilities.join(", ") || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-xs text-slate-500">
        Module gate matrix:{" "}
        <a href="/dashboard/executive/release" className="underline">
          Release Dashboard
        </a>
        . Ops playbook:{" "}
        <code className="rounded bg-slate-100 px-1">docs/operations/rc11/</code>
      </p>
    </div>
  );
}
