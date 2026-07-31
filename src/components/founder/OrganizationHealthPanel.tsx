import type { FounderOrganizationSummary } from "@/lib/platform/founder/types";

type OrganizationHealthPanelProps = {
  organizations: FounderOrganizationSummary[];
  activeOrganizationId?: string | null;
};

export function OrganizationHealthPanel({
  organizations,
  activeOrganizationId,
}: OrganizationHealthPanelProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" aria-labelledby="org-health-heading">
      <h2 id="org-health-heading" className="text-lg font-semibold text-slate-900">
        Organization Health
      </h2>
      {organizations.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">No organizations in scope.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {organizations.map((org) => (
            <li
              key={org.id}
              className={
                org.id === activeOrganizationId
                  ? "rounded-xl border border-brand-200 bg-brand-50/60 px-3 py-2"
                  : "rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2"
              }
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-slate-900">{org.name}</p>
                  <p className="text-xs text-slate-500">{org.slug}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">
                    {org.healthScore ?? "—"}
                  </p>
                  <p className="text-xs capitalize text-slate-500">{org.healthBand}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
