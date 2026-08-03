import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  ADMISSIONS_EXPERIENCE_ENGINES,
  ADMISSIONS_EXPERIENCE_GUARDS,
  ADMISSIONS_PUBLIC_NAV,
  APPLICATION_DASHBOARD_STATUSES,
} from "@/lib/admissions/experience/constants";

export default function AdmissionsExperienceHubPage() {
  return (
    <div className="space-y-8 p-6">
      <PageHeader
        title="Admissions Experience"
        subtitle="Wave 1.1 product orchestration over Identity, Knowledge, Finance, Workflow, Learning Intelligence, Twin, Evidence, and Memory — no parallel engines."
      />

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Guards
        </h2>
        <ul className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
          {Object.entries(ADMISSIONS_EXPERIENCE_GUARDS).map(([k, v]) => (
            <li key={k}>
              <code className="text-xs">{k}</code>: {String(v)}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Engines consumed
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {ADMISSIONS_EXPERIENCE_ENGINES.map((e) => (
            <li
              key={e}
              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
            >
              {e}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          CRM & workflows
        </h2>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <Link href="/dashboard/admissions" className="underline">
            Pipeline / dashboard
          </Link>
          <Link href="/dashboard/admissions/automation" className="underline">
            Automation
          </Link>
          <Link href="/dashboard/admissions/workflows" className="underline">
            Workflows
          </Link>
          <Link href="/dashboard/scholarships" className="underline">
            Scholarships
          </Link>
          <Link href="/academyos/admissions" className="underline">
            AcademyOS shell
          </Link>
        </div>
        <p className="mt-4 text-sm text-slate-600">
          Application dashboard statuses:{" "}
          {APPLICATION_DASHBOARD_STATUSES.join(" · ")}
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Public experience
        </h2>
        <ul className="mt-3 columns-2 gap-3 text-sm sm:columns-3">
          {ADMISSIONS_PUBLIC_NAV.map((item) => (
            <li key={item.href} className="mb-2 break-inside-avoid">
              <Link href={item.href} className="underline">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
