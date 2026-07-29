import Link from "next/link";
import { requireStudentExperienceContext } from "@/lib/portal/student-experience/access";
import { getStudentDocumentCenter } from "@/lib/portal/documents";
import { STUDENT_DOCUMENT_KINDS } from "@/lib/portal/student-experience/constants";
import { searchParentDocumentsInKnowledge } from "@/lib/portal/experience/knowledge-bridge";
import { publishStudentExperienceEvent } from "@/lib/portal/student-experience/events";

export default async function StudentDocumentsPage() {
  const ctx = await requireStudentExperienceContext("/portal/student/documents");
  const docs = await getStudentDocumentCenter(ctx.supabase, ctx.studentId);

  let knowledgeHits: { id: string; title: string; snippet: string }[] = [];
  try {
    knowledgeHits = [
      ...searchParentDocumentsInKnowledge({
        organizationId: ctx.organizationId,
        query: "report progress certificate",
        studentId: ctx.studentId,
      }).results,
    ];
  } catch {
    knowledgeHits = [];
  }

  publishStudentExperienceEvent({
    type: "student.document_viewed",
    organizationId: ctx.organizationId,
    recordType: "student",
    recordId: ctx.studentId,
    actorUserId: ctx.sessionUser.id,
    payload: { knowledgeEngine: "KnowledgeEngine" },
    projectLive: false,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Documents</h1>
        <p className="mt-1 text-slate-600">
          Report cards, progress reports, certificates, and shared resources — KnowledgeEngine owns
          storage and search.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Document kinds</h2>
        <ul className="mt-3 flex flex-wrap gap-2 text-sm">
          {STUDENT_DOCUMENT_KINDS.map((k) => (
            <li key={k.key} className="rounded-full bg-slate-100 px-3 py-1">
              {k.label}
            </li>
          ))}
        </ul>
      </section>

      {Object.entries(docs.grouped).map(([category, items]) =>
        items && items.length > 0 ? (
          <section key={category} className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold capitalize">{category.replace(/_/g, " ")}</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {items.map((d) => (
                <li key={d.id} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span>{d.file_name}</span>
                  <span className="text-slate-500">{d.document_type}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null
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

      <p className="text-sm">
        <Link href="/portal/documents" className="underline">
          Family document center
        </Link>
      </p>
    </div>
  );
}
