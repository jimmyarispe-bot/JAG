/**
 * ENROLLED STUDENTS.
 *
 * Jimmy, 18 October 2026: "Create the Enrolled Student page between the
 * admissions and student success. Once a student completes the initial
 * tuition payment they go into the page accessible by all school leaders".
 *
 * A child is here once their lead is `enrolled` - which, from today, happens
 * when Jimmy records the first tuition payment on Finalizing Contract.
 *
 * WHO SEES WHICH CHILD is row-level security on admissions_leads, the same
 * read the pipeline board uses: Nina sees GA, Danni FL, Heather HS and
 * Virtual, Jimmy all four. This page adds no filter of its own.
 *
 * Deliberately no money on this page. School leaders see who is enrolled and
 * since when; tuition stays on Finalizing Contract, which only Jimmy opens.
 */
import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/ui/PageHeader";
import { byCampus, loadFinalizingChildren } from "@/lib/admissions/finalizing/load";
import { gradeLabel } from "@/lib/constants/grades";
import { hasPermission } from "@/lib/platform/identity/authorization-service";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { createAuthClient } from "@/lib/supabase/server-auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Enrolled Students · The JAG™" };

const SEES_ADMISSIONS = ["admissions.view", "admissions.manage", "admissions.accept"] as const;

function shortDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function EnrolledStudentsPage() {
  const ctx = await getIdentityContext();
  if (!ctx) redirect("/login");

  if (!SEES_ADMISSIONS.some((p) => hasPermission(ctx, p))) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <PageHeader title="Enrolled Students" subtitle="You do not have access to this page" />
      </div>
    );
  }

  const supabase = await createAuthClient();
  const { children, error } = await loadFinalizingChildren(supabase, ["enrolled"], { withMoney: false });
  const campuses = byCampus(children);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        title="Enrolled Students"
        subtitle={`${children.length} ${children.length === 1 ? "child" : "children"} enrolled, by campus`}
      />

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          Could not load Enrolled Students: {error}
        </div>
      ) : null}

      {!error && children.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
          Nobody enrolled yet.
        </p>
      ) : null}

      {campuses.map(({ schoolName, children: list }) => (
        <section key={schoolName} className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold text-slate-900">{schoolName}</h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {list.length}
            </span>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2">Child</th>
                  <th className="px-4 py-2">Grade</th>
                  <th className="px-4 py-2">Parent</th>
                  <th className="px-4 py-2">Enrolled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.map((child) => (
                  <tr key={child.leadId}>
                    <td className="px-4 py-2">
                      <Link
                        href={`/dashboard/admissions/cases/${child.leadId}/full`}
                        className="font-medium text-slate-900 hover:text-brand-700"
                      >
                        {child.firstName} {child.lastName}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-slate-600">{child.grade ? gradeLabel(child.grade) : "—"}</td>
                    <td className="px-4 py-2 text-slate-600">{child.guardianName || "—"}</td>
                    <td className="px-4 py-2 text-slate-600">{shortDate(child.stageEnteredAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
