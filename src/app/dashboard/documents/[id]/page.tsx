import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { DocumentLifecycleActions } from "@/components/documents/DocumentLifecycleActions";
import { DocumentPreview } from "@/components/documents/DocumentPreview";
import { DocumentVersionPanel } from "@/components/documents/DocumentVersionPanel";
import { getIdentityContext } from "@/lib/platform/identity/context";
import {
  canEditDocuments,
  canViewDocuments,
  getDocument,
  listDocumentVersions,
} from "@/lib/documents";
import { createAuthClient } from "@/lib/supabase/server-auth";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function DocumentDetailPage({ params, searchParams }: PageProps) {
  const identity = await getIdentityContext();
  if (!canViewDocuments(identity)) {
    redirect("/dashboard");
  }

  const { id } = await params;
  const sp = await searchParams;
  const tab = sp.tab === "history" ? "history" : "preview";
  const canEdit = canEditDocuments(identity);
  const supabase = await createAuthClient();

  const doc = await getDocument(supabase, id);
  if (!doc) notFound();

  const versions = await listDocumentVersions(supabase, id);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <PageHeader
        title={doc.title}
        subtitle={`${doc.category.replace(/_/g, " ")} · v${doc.current_version} · ${doc.status.replace(/_/g, " ")}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/dashboard/documents"
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Back to documents
            </Link>
            {canEdit ? (
              <DocumentLifecycleActions
                documentId={doc.id}
                title={doc.title}
                status={doc.status}
                auditId={doc.audit_id}
                policyLocked={doc.policy_locked}
                variant="header"
              />
            ) : null}
          </div>
        }
      />

      <dl className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">Audit ID</dt>
          <dd className="font-mono text-slate-800">{doc.audit_id}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">School</dt>
          <dd className="text-slate-800">{doc.school_id ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">MIME</dt>
          <dd className="text-slate-800">{doc.mime_type ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">Tags</dt>
          <dd className="text-slate-800">{doc.tags?.length ? doc.tags.join(", ") : "—"}</dd>
        </div>
        {doc.description ? (
          <div className="sm:col-span-2">
            <dt className="text-xs uppercase tracking-wide text-slate-500">Description</dt>
            <dd className="whitespace-pre-wrap text-slate-800">{doc.description}</dd>
          </div>
        ) : null}
      </dl>

      <div className="flex gap-2 border-b border-slate-200">
        <Link
          href={`/dashboard/documents/${id}`}
          className={`px-3 py-2 text-sm font-medium ${
            tab === "preview"
              ? "border-b-2 border-brand-600 text-brand-700"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Preview
        </Link>
        <Link
          href={`/dashboard/documents/${id}?tab=history`}
          className={`px-3 py-2 text-sm font-medium ${
            tab === "history"
              ? "border-b-2 border-brand-600 text-brand-700"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          History
        </Link>
      </div>

      {tab === "history" ? (
        <DocumentVersionPanel documentId={doc.id} versions={versions} canEdit={canEdit} />
      ) : (
        <DocumentPreview
          title={doc.title}
          mimeType={doc.mime_type}
          fileUrl={doc.file_url}
          description={doc.description}
        />
      )}
    </div>
  );
}
