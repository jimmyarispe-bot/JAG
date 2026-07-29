import Link from "next/link";
import { requireExecutiveExperienceContext } from "@/lib/executive/experience/access";
import { getExecutiveMultiSchoolSummary } from "@/lib/executive/experience/summaries";
import { publishExecutiveExperienceEvent } from "@/lib/executive/experience/events";

export default async function ExecutiveMultiSchoolPage() {
  const ctx = await requireExecutiveExperienceContext();
  const data = await getExecutiveMultiSchoolSummary(ctx.supabase);

  publishExecutiveExperienceEvent({
    type: "executive.multi_school_reviewed",
    organizationId: ctx.organizationId,
    recordType: "organization",
    recordId: ctx.organizationId,
    actorUserId: ctx.actorUserId,
    projectLive: false,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Multi-school overview</h1>
        <p className="mt-1 text-slate-600">{data.note}</p>
      </div>

      <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Campus</th>
              <th className="px-4 py-3 font-medium">Enrollment</th>
              <th className="px-4 py-3 font-medium">Revenue</th>
              <th className="px-4 py-3 font-medium">Staff</th>
              <th className="px-4 py-3 font-medium">Pipeline</th>
              <th className="px-4 py-3 font-medium">Open</th>
            </tr>
          </thead>
          <tbody>
            {data.comparisons.map((row) => (
              <tr key={row.campus} className="border-b border-slate-100">
                <td className="px-4 py-3">{row.campus}</td>
                <td className="px-4 py-3">{row.enrollment}</td>
                <td className="px-4 py-3">{formatMoney(row.revenue)}</td>
                <td className="px-4 py-3">{row.utilizationStaff}</td>
                <td className="px-4 py-3">{row.pipeline}</td>
                <td className="px-4 py-3">
                  {row.href ? (
                    <Link href={row.href} className="text-brand-700 underline">
                      Drill
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
            {!data.comparisons.length && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No campus rows yet.{" "}
                  <Link href="/dashboard/executive/network" className="underline">
                    Network dashboard
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/dashboard/executive/network" className="underline">
          Network dashboard
        </Link>
        <Link href="/dashboard/executive/capacity" className="underline">
          Capacity
        </Link>
        <Link href="/dashboard/executive/benchmarks" className="underline">
          Benchmarks
        </Link>
      </div>
    </div>
  );
}

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}
