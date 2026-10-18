/**
 * FINALIZING CONTRACT.
 *
 * Jimmy, 18 October 2026: "add another subpage/menu under n label it
 * Finalizing Contract. once a student is marked accepted move the student
 * here. this is where all of the tuition, scholarship, and schedule of tuition
 * payments is recorded and created. divide by campus and notify
 * jimmy.arispe@theacademyway.org each time a student reaches this stage. this
 * page is only accessible by jimmy right now. once the initial payment is made
 * move these to Enrolled Students."
 *
 * A child is here while their lead is `accepted`. The page is a checklist per
 * child, in the order the work happens:
 *
 *   1. Student record     the lead becomes a student (nothing billed)
 *   2. Scholarships       awarded with an amount, or applied for with none
 *   3. Tuition plan       built in the existing plan builder, then marked final
 *   4. Contract           the parent signs in the JAG
 *   5. First payment      recorded here; paid in full, the child is Enrolled
 *
 * Only Jimmy (the FOUNDER role). Anybody else gets a 404, not a "no access"
 * page - the page's existence is itself not for them yet.
 */
import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/ui/PageHeader";
import { FinalizingChildCard } from "@/components/admissions/finalizing/FinalizingChildCard";
import { byCampus, loadFinalizingChildren } from "@/lib/admissions/finalizing/load";
import { canViewFounderDashboard } from "@/lib/dashboard/founder-dashboard-access";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { createAuthClient } from "@/lib/supabase/server-auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Finalizing Contract · The JAG™" };

export default async function FinalizingContractPage() {
  const ctx = await getIdentityContext();
  if (!ctx) redirect("/login");
  if (!canViewFounderDashboard(ctx)) notFound();

  const supabase = await createAuthClient();
  const { children, error } = await loadFinalizingChildren(supabase, ["accepted"]);
  const campuses = byCampus(children);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        title="Finalizing Contract"
        subtitle="Accepted children: student record, scholarships, tuition plan, contract, first payment"
      />

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          Could not load Finalizing Contract: {error}
        </div>
      ) : null}

      {!error && children.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
          Nobody is in Finalizing Contract.
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
          <div className="grid gap-4 lg:grid-cols-2">
            {list.map((child) => (
              <FinalizingChildCard key={child.leadId} child={child} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
