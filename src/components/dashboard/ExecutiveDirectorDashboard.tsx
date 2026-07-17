import Link from "next/link";
import { EXECUTIVE_DIRECTOR_DASHBOARD_NAV } from "@/lib/dashboard/executive-director-dashboard";

interface ExecutiveDirectorDashboardProps {
  fullName: string;
  roleLabel: string;
  productName: string;
  greeting: string;
  today: string;
}

export function ExecutiveDirectorDashboard({
  fullName,
  roleLabel,
  productName,
  greeting,
  today,
}: ExecutiveDirectorDashboardProps) {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-6 text-white shadow-lg sm:p-8">
        <p className="text-sm font-medium text-slate-300">
          {greeting} · {today}
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          Executive Director
        </h2>
        <p className="mt-2 text-sm text-slate-300">Welcome back, {fullName}</p>
        <p className="mt-3 max-w-2xl text-sm text-slate-300/90 sm:text-base">
          School operations command center for {productName}. Enrollment, staffing, compliance,
          and executive KPIs — without Founder surfaces.
        </p>
        <p className="mt-4 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-100 ring-1 ring-white/20">
          {roleLabel || "Executive Director"}
        </p>
      </section>

      <section>
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">Operating Areas</h2>
          <p className="mt-1 text-sm text-slate-500">
            Executive Director dashboard — Founder widgets are not shown
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {EXECUTIVE_DIRECTOR_DASHBOARD_NAV.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="group rounded-2xl border border-slate-200/80 bg-white px-5 py-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
            >
              <p className="text-sm font-semibold text-slate-900 group-hover:text-brand-700">
                {item.label}
              </p>
              <p className="mt-1 text-xs text-slate-500">{item.description}</p>
              <p className="mt-3 text-xs font-medium text-brand-600">Open →</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
