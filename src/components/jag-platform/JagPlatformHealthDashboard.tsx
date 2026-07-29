import type { PlatformHealthSnapshot } from "@/lib/jag-platform/health";

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function statusClass(status: string): string {
  if (status === "operational") return "text-emerald-700";
  if (status === "degraded") return "text-amber-700";
  return "text-rose-700";
}

export function JagPlatformHealthDashboard({
  health,
}: {
  readonly health: PlatformHealthSnapshot;
}) {
  const v = health.version;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Internal · Administrators only
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">
          Platform Health
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {v.productName} readiness snapshot for GA operations.
        </p>
      </header>

      <Card title="System Version">
        <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-slate-500">Product</dt>
            <dd className="font-medium">{v.productName}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Platform Version</dt>
            <dd className="font-medium">{v.platformVersion}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Schema Version</dt>
            <dd className="font-medium">{v.schemaVersion}</dd>
          </div>
          <div>
            <dt className="text-slate-500">API Version</dt>
            <dd className="font-medium">{v.apiVersion}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Connector Version</dt>
            <dd className="font-medium">{v.connectorVersion}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Evidence Version</dt>
            <dd className="font-medium">{v.evidenceVersion}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Knowledge Graph Version</dt>
            <dd className="font-medium">{v.knowledgeGraphVersion}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-slate-500">Build</dt>
            <dd className="font-medium">{v.buildLabel}</dd>
          </div>
          <div>
            <dt className="text-slate-500">System Health</dt>
            <dd
              className={`font-semibold capitalize ${statusClass(health.systemHealth)}`}
            >
              {health.systemHealth}
            </dd>
          </div>
        </dl>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Modules">
          <ul className="space-y-2 text-sm">
            {health.modules.map((m) => (
              <li
                key={m.id}
                className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2 last:border-0"
              >
                <div>
                  <p className="font-medium text-slate-900">{m.name}</p>
                  <p className="text-xs text-slate-500">{m.detail}</p>
                </div>
                <span className={`text-xs font-semibold capitalize ${statusClass(m.status)}`}>
                  {m.status.replace("_", " ")}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Database">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Mode</dt>
              <dd>{health.database.mode}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Schema</dt>
              <dd>{health.database.schemaVersion}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Status</dt>
              <dd className={statusClass(health.database.status)}>
                {health.database.status}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Organizations</dt>
              <dd>{health.organizationCount}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Evidence records</dt>
              <dd>{health.evidenceCount}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Graph nodes / edges</dt>
              <dd>
                {health.knowledgeGraphNodes} / {health.knowledgeGraphEdges}
              </dd>
            </div>
          </dl>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card title="Evidence Queue">
          <ul className="space-y-1 text-sm">
            <li>Waiting: {health.evidenceQueue.waiting}</li>
            <li>Running: {health.evidenceQueue.running}</li>
            <li>Failed: {health.evidenceQueue.failed}</li>
          </ul>
        </Card>
        <Card title="Processing Jobs">
          <ul className="space-y-1 text-sm">
            <li>Completed: {health.processingJobs.completed}</li>
            <li>Failed: {health.processingJobs.failed}</li>
            <li>
              Avg time: {health.averageProcessingTimeMs}ms
            </li>
          </ul>
        </Card>
        <Card title="Connector Status">
          <ul className="space-y-1 text-sm">
            <li>Installed: {health.connectors.installed}</li>
            <li>Connected: {health.connectors.connected}</li>
            <li>Errored: {health.connectors.errored}</li>
          </ul>
        </Card>
        <Card title="Event Throughput">
          <p className="text-2xl font-semibold text-slate-900">
            {health.eventThroughputLastHour}
          </p>
          <p className="text-xs text-slate-500">Events in the last hour</p>
          <p className="mt-2 text-sm text-slate-600">
            Failed jobs: {health.failedJobs}
          </p>
        </Card>
      </div>

      <Card title="Recent Errors">
        {health.recentErrors.length === 0 ? (
          <p className="text-sm text-slate-500">No recent errors logged.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {health.recentErrors.map((err, idx) => (
              <li key={`${err.at}-${idx}`} className="rounded-lg bg-rose-50 px-3 py-2 text-rose-900">
                <p className="font-medium">
                  {err.module}: {err.message}
                </p>
                <p className="text-xs opacity-80">
                  {new Date(err.at).toLocaleString()}
                  {err.correlationId ? ` · ${err.correlationId}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
