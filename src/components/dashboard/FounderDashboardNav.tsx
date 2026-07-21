import { ModuleCard } from "@/components/experience-system/cards";
import { FOUNDER_DASHBOARD_NAV } from "@/lib/dashboard/founders-navigation";

export function FounderDashboardNav() {
  return (
    <section>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">Founder Command</h2>
        <p className="mt-1 text-sm text-slate-500">
          Founder-only surfaces — not visible to other roles
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {FOUNDER_DASHBOARD_NAV.map((item) => (
          <ModuleCard
            key={item.href + item.label}
            title={item.label}
            href={item.href}
            padding="sm"
            className="group px-5 py-4 hover:border-brand-200"
            titleClassName="transition-colors group-hover:text-brand-700"
          />
        ))}
      </div>
    </section>
  );
}
