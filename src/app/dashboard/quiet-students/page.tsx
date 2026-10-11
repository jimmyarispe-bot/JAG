/**
 * QUIET STUDENTS — the families who left the pipeline, and the ones still
 * waiting on a decision nobody has made.
 *
 * RENAMED FROM OLD STUDENTS the same day it was built. A declined family was
 * never a student and neither is the child in Decision Needed; what all three
 * columns have in common is that nothing is moving and nobody is chasing.
 * Jimmy: "let's change this new page view from old student to quiet
 * students".
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
 * THE SEARCH AND FILTERS ARE THE BOARD'S OWN. Jimmy, 11 October: "also need
 * the quiet student page to have the same filter, sorting and search ability
 * as the current pipeline". The columns moved into QuietStudentsBoard, a
 * client component that imports the SAME PipelineFilters and the SAME
 * applyFilters the pipeline uses - not a second set that looks alike, which
 * is how one page stops finding a child the other page finds. This file does
 * the read and nothing else.
 *
 * DECISION NEEDED IS FIRST, and it is first on purpose. It is the only column
 * here that is waiting on a person. Declined and Alumni are finished;
 * Decision Needed is a child whose family has not been told anything.
 */
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { QuietStudentsBoard } from "@/components/admissions/QuietStudentsBoard";
import { getLeads } from "@/lib/admissions/queries";
import type { BoardLead } from "@/lib/admissions/board-filters";

export const dynamic = "force-dynamic";

export default async function QuietStudentsPage() {
  const leads = (await getLeads()) as unknown as readonly BoardLead[];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Quiet Students"
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

      <QuietStudentsBoard leads={leads} />
    </div>
  );
}
