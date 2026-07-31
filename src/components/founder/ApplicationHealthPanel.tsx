import type { FounderApplicationSummary } from "@/lib/platform/founder/types";

type ApplicationHealthPanelProps = {
  applications: FounderApplicationSummary[];
  activeApplicationKey?: string | null;
};

export function ApplicationHealthPanel({
  applications,
  activeApplicationKey,
}: ApplicationHealthPanelProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" aria-labelledby="app-health-heading">
      <h2 id="app-health-heading" className="text-lg font-semibold text-slate-900">
        Application Health
      </h2>
      {applications.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">No applications registered.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {applications.map((app) => (
            <li
              key={app.key}
              className={
                app.key === activeApplicationKey
                  ? "rounded-xl border border-brand-200 bg-brand-50/60 px-3 py-2"
                  : "rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2"
              }
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-slate-900">{app.name}</p>
                  <p className="text-xs text-slate-500">{app.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold capitalize text-slate-900">
                    {app.status}
                  </p>
                  <p className="text-xs text-slate-500">
                    {app.organizationCount} org{app.organizationCount === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
