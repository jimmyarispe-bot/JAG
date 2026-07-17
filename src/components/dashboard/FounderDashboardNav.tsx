import Link from "next/link";
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
          <Link
            key={item.href + item.label}
            href={item.href}
            className="group rounded-2xl border border-slate-200/80 bg-white px-5 py-4 shadow-sm transition-all hover:border-brand-200 hover:shadow-md"
          >
            <p className="text-sm font-semibold text-slate-900 group-hover:text-brand-700">
              {item.label}
            </p>
            <p className="mt-1 text-xs text-slate-500">Open →</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
