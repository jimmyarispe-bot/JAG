import { requireStudentExperienceContext } from "@/lib/portal/student-experience/access";
import { getStudentAssignmentBuckets } from "@/lib/portal/student-experience/assignments";
import { publishStudentExperienceEvent } from "@/lib/portal/student-experience/events";

function ObligationList({
  title,
  items,
  empty,
}: {
  title: string;
  items: { id: string; title?: string | null; due_date?: string | null; status?: string | null }[];
  empty: string;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="font-semibold text-slate-900">{title}</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {items.map((item) => (
          <li key={item.id} className="rounded-lg bg-slate-50 px-3 py-2">
            <span className="font-medium">{item.title ?? "Assignment"}</span>
            {item.due_date && (
              <span className="ml-2 text-slate-500">
                due {new Date(item.due_date).toLocaleDateString()}
              </span>
            )}
            {item.status && (
              <span className="ml-2 capitalize text-slate-500">{item.status}</span>
            )}
          </li>
        ))}
        {!items.length && <li className="text-slate-500">{empty}</li>}
      </ul>
    </section>
  );
}

export default async function StudentAssignmentsPage() {
  const ctx = await requireStudentExperienceContext("/portal/student/assignments");
  const buckets = await getStudentAssignmentBuckets(ctx.supabase, ctx.studentId);

  publishStudentExperienceEvent({
    type: "student.assignment_viewed",
    organizationId: ctx.organizationId,
    recordType: "student",
    recordId: ctx.studentId,
    actorUserId: ctx.sessionUser.id,
    projectLive: false,
  });

  const map = (items: typeof buckets.current) =>
    items.map((o) => ({
      id: o.id,
      title: o.title,
      due_date: o.due_date,
      status: o.status,
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Assignments</h1>
        <p className="mt-1 text-slate-600">
          Current, due soon, late, and completed work from existing assignment deadline services.
        </p>
      </div>
      <ObligationList title="Current" items={map(buckets.current)} empty="No current assignments." />
      <ObligationList title="Due soon" items={map(buckets.dueSoon)} empty="Nothing due soon." />
      <ObligationList title="Late" items={map(buckets.late)} empty="No late assignments." />
      <ObligationList
        title="Completed"
        items={map(buckets.completed)}
        empty="No completed assignments yet."
      />
      <p className="text-sm text-slate-500">
        Teacher feedback appears on assessments and in your Learning Coach evidence notes.
      </p>
    </div>
  );
}
