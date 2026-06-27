import type {
  PlatformServiceHealthCheck,
  RegistryAuditReport,
} from "@/lib/platform/diagnostics";
import type { ConfigModuleRow } from "@/lib/configuration/types";

function StatusBadge({ status }: { status: PlatformServiceHealthCheck["status"] }) {
  const styles = {
    healthy: "bg-emerald-100 text-emerald-800",
    degraded: "bg-amber-100 text-amber-800",
    unavailable: "bg-red-100 text-red-800",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}

function IssueList({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: string[];
  emptyLabel: string;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold text-slate-900">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-emerald-700">{emptyLabel}</p>
      ) : (
        <ul className="space-y-1 text-sm text-slate-700">
          {items.map((item) => (
            <li key={item} className="font-mono text-xs">
              {item}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export interface PlatformDiagnosticsViewProps {
  report: RegistryAuditReport;
  serviceHealth: PlatformServiceHealthCheck[];
  installedModules: ConfigModuleRow[];
}

export function PlatformDiagnosticsView({
  report,
  serviceHealth,
  installedModules,
}: PlatformDiagnosticsViewProps) {
  const duplicateItems = report.duplicateSectionKeys.map(
    (d) => `${d.kind}:${d.key}`
  );
  const missingItems = report.missingModuleRegistrations.map(
    (m) => `${m.kind}:${m.sectionKey}`
  );
  const orphanedItems = report.orphanedSectionModules.map((o) => o.id);
  const invalidGroupItems = report.invalidNavigationGroups.map(
    (g) => `${g.kind}:${g.sectionKey} → ${g.group}`
  );

  const enabledModules = installedModules.filter(
    (m) => m.status === "installed" || m.status === "enabled"
  );

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-slate-500">Read-only developer diagnostics</p>
        <h1 className="text-2xl font-semibold text-slate-900">Platform Diagnostics</h1>
        <p className="mt-1 text-sm text-slate-600">
          Registry integrity, platform service health, and module installation snapshot.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Profile kinds</p>
          <p className="mt-1 text-2xl font-semibold">{report.profileKinds.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Sections</p>
          <p className="mt-1 text-2xl font-semibold">{report.sections.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Section modules</p>
          <p className="mt-1 text-2xl font-semibold">{report.sectionModules.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Installed modules</p>
          <p className="mt-1 text-2xl font-semibold">{enabledModules.length}</p>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">Registered profile kinds</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b text-slate-500">
                <th className="py-2 pr-4 font-medium">Kind</th>
                <th className="py-2 pr-4 font-medium">Label</th>
                <th className="py-2 pr-4 font-medium">Base path</th>
                <th className="py-2 pr-4 font-medium">Sections</th>
                <th className="py-2 font-medium">Modules</th>
              </tr>
            </thead>
            <tbody>
              {report.profileKinds.map((kind) => (
                <tr key={kind.kind} className="border-b border-slate-100">
                  <td className="py-2 pr-4 font-mono text-xs">{kind.kind}</td>
                  <td className="py-2 pr-4">{kind.label}</td>
                  <td className="py-2 pr-4 font-mono text-xs">{kind.basePath}</td>
                  <td className="py-2 pr-4">{kind.sectionCount}</td>
                  <td className="py-2">{kind.moduleCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <IssueList
          title="Duplicate section keys"
          items={duplicateItems}
          emptyLabel="No duplicate section registrations detected."
        />
        <IssueList
          title="Missing module registrations"
          items={missingItems}
          emptyLabel="All registered sections have section modules."
        />
        <IssueList
          title="Orphaned section modules"
          items={orphanedItems}
          emptyLabel="No orphaned section modules detected."
        />
        <IssueList
          title="Invalid navigation groups"
          items={invalidGroupItems}
          emptyLabel="All section navigation groups are valid."
        />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">Platform service health</h2>
        <ul className="space-y-2">
          {serviceHealth.map((check) => (
            <li
              key={check.service}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2"
            >
              <div>
                <p className="font-medium text-slate-900">{check.service}</p>
                <p className="text-xs text-slate-500">{check.detail}</p>
              </div>
              <StatusBadge status={check.status} />
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Activity catalog</h2>
          <p className="mb-2 text-sm text-slate-600">
            {report.activityCatalogSize} event types registered
          </p>
          <ul className="max-h-48 overflow-y-auto font-mono text-xs text-slate-700">
            {report.activityEventTypes.map((eventType) => (
              <li key={eventType}>{eventType}</li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Relationship types</h2>
          <ul className="max-h-48 overflow-y-auto font-mono text-xs text-slate-700">
            {report.relationshipTypes.map((type) => (
              <li key={type}>{type}</li>
            ))}
          </ul>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">Registered sections</h2>
        <ul className="max-h-64 overflow-y-auto font-mono text-xs text-slate-700">
          {report.sections.map(({ kind, section }) => (
            <li key={`${kind}:${section.key}`}>
              {kind}:{section.key} — {section.label} ({section.group ?? "pinned"})
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">Registered section modules</h2>
        <ul className="max-h-64 overflow-y-auto font-mono text-xs text-slate-700">
          {report.sectionModules.map((module) => (
            <li key={module.id}>{module.id}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">Installed modules</h2>
        {enabledModules.length === 0 ? (
          <p className="text-sm text-slate-600">No enabled modules for the current organization.</p>
        ) : (
          <ul className="space-y-1 text-sm text-slate-700">
            {enabledModules.map((module) => (
              <li key={module.moduleKey}>
                <span className="font-mono text-xs">{module.moduleKey}</span> — {module.displayName}{" "}
                <span className="text-xs text-slate-500">({module.status})</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
