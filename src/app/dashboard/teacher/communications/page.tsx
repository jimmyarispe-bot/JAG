import Link from "next/link";
import { requireTeacherExperienceContext } from "@/lib/teacher/experience/access";
import { getTeacherOutreachHistory } from "@/lib/teacher/queries";
import { publishTeacherExperienceEvent } from "@/lib/teacher/experience/events";

export default async function TeacherCommunicationsPage() {
  const ctx = await requireTeacherExperienceContext();
  const outreach = await getTeacherOutreachHistory(ctx.supabase, ctx.employeeId);

  publishTeacherExperienceEvent({
    type: "teacher.parent_message",
    organizationId: ctx.organizationId,
    recordType: "employee",
    recordId: ctx.employeeId,
    actorUserId: ctx.actorUserId,
    payload: { view: "communications" },
    projectLive: false,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Parent communication</h1>
        <p className="mt-1 text-slate-600">
          Secure messaging, session summaries, announcements, and attachments via existing
          Communications / outreach services.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          href="/portal/messages"
          className="rounded-lg bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700"
        >
          Open secure messaging
        </Link>
        <Link href="/dashboard/teacher?work=family_communication" className="rounded-lg border border-slate-300 px-4 py-2">
          Family communication work queue
        </Link>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Recent outreach</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {outreach.map((o) => {
            const st = Array.isArray(o.students) ? o.students[0] : o.students;
            const name = st
              ? `${(st as { first_name?: string }).first_name ?? ""} ${(st as { last_name?: string }).last_name ?? ""}`.trim()
              : "Family";
            return (
              <li key={o.id} className="rounded-lg bg-slate-50 px-3 py-2">
                {name} — {o.subject ?? o.channel ?? "Outreach"} ·{" "}
                {o.created_at ? new Date(o.created_at).toLocaleString() : ""}
              </li>
            );
          })}
          {!outreach.length && (
            <li className="text-slate-500">No outreach history yet. Start from secure messaging.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
