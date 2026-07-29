import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { getLinkedStudentsForPortal } from "@/lib/portal/dashboard";
import { getStudentDocumentCenter } from "@/lib/portal/documents";
import { PARENT_CONTRACT_KINDS } from "@/lib/portal/experience/constants";

export default async function ParentContractsPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login?next=/portal/contracts");

  const supabase = await createAuthClient();
  const students = await getLinkedStudentsForPortal(supabase, sessionUser.id);

  const contractDocs = [];
  for (const s of students) {
    const center = await getStudentDocumentCenter(supabase, s.id);
    for (const doc of center.allDocuments) {
      const type = String(doc.document_type ?? "").toLowerCase();
      if (
        type.includes("contract") ||
        type.includes("agreement") ||
        type.includes("handbook") ||
        type.includes("tuition") ||
        type.includes("enrollment")
      ) {
        contractDocs.push({
          ...doc,
          studentName: `${s.first_name} ${s.last_name}`,
        });
      }
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Contracts</h1>
        <p className="mt-1 text-slate-600">
          Enrollment and tuition agreements, handbook acknowledgements, and signed copies.
          KnowledgeEngine owns executed document storage.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-900">Agreement types</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          {PARENT_CONTRACT_KINDS.map((c) => (
            <li key={c.key} className="flex justify-between border-b border-slate-100 py-2">
              <span>{c.label}</span>
              <span className="text-xs text-slate-500">KnowledgeEngine</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-900">Signed copies on file</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {contractDocs.map((d) => (
            <li key={d.id} className="rounded-lg bg-slate-50 px-3 py-2">
              {d.studentName} — {d.document_type}{" "}
              <span className="text-slate-500">({d.status})</span>
            </li>
          ))}
          {!contractDocs.length && (
            <li className="text-slate-500">
              No contract documents yet. Check{" "}
              <Link href="/portal/documents" className="underline">
                Documents
              </Link>{" "}
              or{" "}
              <Link href="/apply/portal" className="underline">
                Admissions
              </Link>
              .
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
