import Link from "next/link";
import { requireTeacherExperienceContext } from "@/lib/teacher/experience/access";
import { getTeacherNotes, getTeacherRosterStudents } from "@/lib/teacher/queries";
import { getStudentDocumentCenter } from "@/lib/portal/documents";
import { searchParentDocumentsInKnowledge } from "@/lib/portal/experience/knowledge-bridge";
import { publishTeacherExperienceEvent } from "@/lib/teacher/experience/events";

export default async function TeacherDocumentsPage() {
  const ctx = await requireTeacherExperienceContext();
  const [notes, roster] = await Promise.all([
    getTeacherNotes(ctx.supabase, ctx.employeeId),
    getTeacherRosterStudents(ctx.supabase, ctx.employeeId),
  ]);

  const firstStudentId = (roster[0] as { id?: string } | undefined)?.id;
  const studentDocs = firstStudentId
    ? await getStudentDocumentCenter(ctx.supabase, firstStudentId)
    : null;

  let knowledgeHits: { id: string; title: string; snippet: string }[] = [];
  try {
    knowledgeHits = [
      ...searchParentDocumentsInKnowledge({
        organizationId: ctx.organizationId,
        query: "lesson template evidence",
      }).results,
    ];
  } catch {
    knowledgeHits = [];
  }

  publishTeacherExperienceEvent({
    type: "teacher.document_viewed",
    organizationId: ctx.organizationId,
    recordType: "employee",
    recordId: ctx.employeeId,
    actorUserId: ctx.actorUserId,
    payload: { knowledgeEngine: "KnowledgeEngine" },
    projectLive: false,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Documents</h1>
        <p className="mt-1 text-slate-600">
          Student documents, lesson resources, templates, and evidence — KnowledgeEngine owns
          storage and search.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Instructional notes</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {notes.slice(0, 15).map((n) => (
            <li key={n.id} className="rounded-lg bg-slate-50 px-3 py-2">
              {n.title}
            </li>
          ))}
          {!notes.length && <li className="text-slate-500">No instructional notes yet.</li>}
        </ul>
      </section>

      {studentDocs && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">Sample student documents (first roster student)</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {studentDocs.allDocuments.slice(0, 10).map((d) => (
              <li key={d.id} className="rounded-lg bg-slate-50 px-3 py-2">
                {d.file_name} · {d.document_type}
              </li>
            ))}
            {!studentDocs.allDocuments.length && (
              <li className="text-slate-500">No documents for this student.</li>
            )}
          </ul>
          <Link href="/dashboard/students" className="mt-3 inline-block text-sm underline">
            Open student records
          </Link>
        </section>
      )}

      {knowledgeHits.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">Knowledge search</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {knowledgeHits.map((h) => (
              <li key={h.id} className="rounded-lg bg-slate-50 px-3 py-2">
                {h.title}
                <p className="text-xs text-slate-500">{h.snippet}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
