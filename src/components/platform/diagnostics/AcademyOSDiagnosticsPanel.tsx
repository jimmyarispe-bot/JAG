import type { AcademyOSDiagnosticsSnapshot } from "@/applications/academyos/runtime/diagnostics";

function BoolBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        ok ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
      }`}
    >
      {label}: {ok ? "OK" : "FAIL"}
    </span>
  );
}

function ChipList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-2 text-sm font-semibold text-slate-900">
        {title}{" "}
        <span className="font-normal text-slate-500">({items.length})</span>
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">None registered.</p>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <li
              key={item}
              className="rounded-md bg-slate-50 px-2 py-1 font-mono text-[11px] text-slate-700"
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function AcademyOSDiagnosticsPanel({
  snapshot,
}: {
  snapshot: AcademyOSDiagnosticsSnapshot;
}) {
  return (
    <section className="space-y-4">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-500">Application runtime</p>
        <h2 className="text-xl font-semibold text-slate-900">AcademyOS Diagnostics</h2>
        <p className="mt-1 text-sm text-slate-600">
          Startup contract, composition readiness, and registry inventory.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <BoolBadge ok={snapshot.platformInitialized} label="Platform" />
          <BoolBadge ok={snapshot.academyOsInitialized} label="AcademyOS" />
          <BoolBadge ok={snapshot.compositionReady} label="Composition" />
          <BoolBadge ok={snapshot.healthOk} label="Health" />
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">AcademyOS version</p>
          <p className="mt-1 font-mono text-lg font-semibold">{snapshot.academyOsVersion}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Platform version</p>
          <p className="mt-1 font-mono text-lg font-semibold">
            {snapshot.platformVersion ?? "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Startup status</p>
          <p className="mt-1 text-lg font-semibold capitalize">{snapshot.startupStatus}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Persistence driver</p>
          <p className="mt-1 font-mono text-lg font-semibold">
            {snapshot.repositoryDriver ?? "—"}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChipList title="Providers" items={snapshot.registeredProviders} />
        <ChipList title="Application services" items={snapshot.registeredApplicationServices} />
        <ChipList title="Workflows" items={snapshot.registeredWorkflows} />
        <ChipList title="Entities" items={snapshot.registeredEntities} />
        <ChipList title="Forms" items={snapshot.registeredForms} />
        <ChipList title="APIs" items={snapshot.registeredApis} />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-2 text-sm font-semibold text-slate-900">
          Navigation ({snapshot.navigationItemCount})
        </h3>
        <ul className="space-y-1 font-mono text-xs text-slate-700">
          {snapshot.navigationHrefs.map((href) => (
            <li key={href}>{href}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Health checks</h3>
        <ul className="space-y-2">
          {snapshot.healthChecks.map((check) => (
            <li
              key={check.name}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2"
            >
              <div>
                <p className="font-medium text-slate-900">{check.name}</p>
                {check.detail ? (
                  <p className="text-xs text-slate-500">{check.detail}</p>
                ) : null}
              </div>
              <BoolBadge ok={check.ok} label={check.ok ? "pass" : "fail"} />
            </li>
          ))}
        </ul>
        {snapshot.healthIssues.length > 0 ? (
          <ul className="mt-3 space-y-1 text-sm text-red-700">
            {snapshot.healthIssues.map((issue) => (
              <li key={issue.code} className="font-mono text-xs">
                {issue.code}: {issue.message}
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </section>
  );
}
