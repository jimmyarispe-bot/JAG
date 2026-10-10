/**
 * OLD STUDENTS — the families who left the pipeline, and the ones still
 * waiting on a decision nobody has made.
 *
 * Jimmy, 10 October 2026:
 *
 *   "create a new button on left sidebar that says old students"
 *   "in the old students view/screen the only columns should be Decision
 *    Needed, Declined, and Alumni"
 *   "Put Sedona in decision needed in old students"
 *   "the Declined, waitlisted and not returning should be taken out of the
 *    current admissions crm"
 *
 * WHY IT EXISTS. 336 children were on the admissions board and 97 of them had
 * already gone — 83 declined, 13 alumni, and one child waiting since August.
 * A board a school leader has to read past is a board she stops reading.
 *
 * THEY ARE MOVED, NOT DELETED. Every one of these families is a real record
 * with a real history, and a declined child can inquire again next year.
 *
 * CAMPUS SCOPING COMES FROM getLeads, which is the same read the pipeline
 * board uses and is scoped by row-level security. Nina sees GA, Danni sees
 * FL, Heather sees HS and Virtual. Deliberately the same read rather than a
 * second query doing its own filtering — two queries answering one question
 * about who may see a child is how a child ends up visible to the wrong
 * campus.
 *
 * DECISION NEEDED IS FIRST, and it is first on purpose. It is the only column
 * here that is waiting on a person. Declined and Alumni are finished;
 * Decision Needed is a child whose family has not been told anything.
 */
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { getLeads } from "@/lib/admissions/queries";
import { OLD_STUDENT_LEAD_STAGES } from "@/lib/constants/admissions";

export const dynamic = "force-dynamic";

/** Whole days between a date and now, floored. Null when there is no date. */
function daysSince(value: unknown): number | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const then = new Date(value);
  if (Number.isNaN(then.getTime())) return null;
  const days = Math.floor((Date.now() - then.getTime()) / 86_400_000);
  return days < 0 ? 0 : days;
}

function fullName(lead: Record<string, unknown>): string {
  const first = String(lead.first_name ?? "").trim();
  const last = String(lead.last_name ?? "").trim();
  return `${first} ${last}`.trim() || "Unnamed child";
}

function guardianName(lead: Record<string, unknown>): string {
  const first = String(lead.guardian_first_name ?? "").trim();
  const last = String(lead.guardian_last_name ?? "").trim();
  return `${first} ${last}`.trim();
}

export default async function OldStudentsPage() {
  const leads = await getLeads();

  const byStage = new Map<string, Record<string, unknown>[]>();
  for (const stage of OLD_STUDENT_LEAD_STAGES) byStage.set(stage.value, []);
  for (const lead of leads as unknown as Record<string, unknown>[]) {
    const bucket = byStage.get(String(lead.lead_stage ?? ""));
    if (bucket) bucket.push(lead);
  }

  const total = [...byStage.values()].reduce((n, rows) => n + rows.length, 0);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Old Students"
        subtitle="Families who have gone, and the ones still waiting on a decision"
        actions={
          <Link
            href="/dashboard/admissions"
            className="rounded-xl border border-brand-200 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
          >
            ← Current Admissions Pipeline
          </Link>
        }
      />

      <p className="text-sm text-slate-500">
        {total === 0
          ? "Nobody here."
          : `${total} ${total === 1 ? "family" : "families"}, at your campus.`}
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        {OLD_STUDENT_LEAD_STAGES.map((stage) => {
          const rows = byStage.get(stage.value) ?? [];
          /* Decision Needed is the only column anybody has to act on, so it is
             the only one that carries a colour. */
          const waiting = stage.value === "waitlisted";

          return (
            <section
              key={stage.value}
              className={`rounded-2xl border p-4 ${
                waiting
                  ? "border-orange-300 bg-orange-50/60"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <h2
                  className={`text-sm font-semibold ${
                    waiting ? "text-orange-900" : "text-slate-900"
                  }`}
                >
                  {stage.label}
                </h2>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    waiting
                      ? "bg-orange-200 text-orange-900"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {rows.length}
                </span>
              </div>

              {waiting && rows.length > 0 && (
                <p className="mt-2 text-xs text-orange-900">
                  {rows.length === 1
                    ? "This family has not been told anything."
                    : "These families have not been told anything."}
                </p>
              )}

              <div className="mt-3 space-y-2">
                {rows.length === 0 && (
                  <p className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-400">
                    Nobody
                  </p>
                )}

                {rows.map((lead) => {
                  const days = daysSince(lead.created_at);
                  const guardian = guardianName(lead);
                  return (
                    <Link
                      key={String(lead.id)}
                      href={`/dashboard/admissions/cases/${String(lead.id)}`}
                      className="block rounded-xl border border-slate-200 bg-white p-3 hover:border-slate-400"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-slate-900">
                          {fullName(lead)}
                        </p>
                        {days !== null && (
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
                              waiting
                                ? "bg-orange-100 text-orange-900"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {days}d
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {String(
                          (lead.schools as { name?: string } | null)?.name ?? "—"
                        )}
                      </p>
                      {guardian && (
                        <p className="mt-1 text-xs text-slate-400">{guardian}</p>
                      )}
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
