import type { OrganizationMonitorReading } from "@/lib/platform/intelligence/organization/types";

interface OrganizationMapProps {
  readings: readonly OrganizationMonitorReading[];
  organizationId: string | null;
  schoolId: string | null;
  requestId: string | null;
}

export function OrganizationMap({
  readings,
  organizationId,
  schoolId,
  requestId,
}: OrganizationMapProps) {
  return (
    <section id="organization-map" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" data-stream-ready="true">
      <h2 className="text-lg font-semibold text-slate-900">Organization Map</h2>
      <p className="mt-1 text-sm text-slate-500">
        Monitor surface for org {organizationId ?? "n/a"}
        {schoolId ? ` · school ${schoolId}` : ""}
        {requestId ? ` · request ${requestId}` : ""}
      </p>
      {readings.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">No monitor readings in this cycle.</p>
      ) : (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {readings.map((reading) => (
            <li key={reading.monitor} className="rounded-xl border border-slate-100 px-3 py-2.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {reading.monitor.replaceAll("_", " ")}
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{reading.score}</p>
              <p className="text-xs capitalize text-slate-500">{reading.status}</p>
              {reading.metrics[0] && (
                <p className="mt-1 text-xs text-slate-500">
                  {reading.metrics[0].label}: {reading.metrics[0].value}
                  {reading.metrics[0].unit ? ` ${reading.metrics[0].unit}` : ""}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
