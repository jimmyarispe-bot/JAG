import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { DocumentsDashboard } from "@/components/documents/DocumentsDashboard";
import { CreateDocumentForm } from "@/components/documents/CreateDocumentForm";
import { getIdentityContext } from "@/lib/platform/identity/context";
import {
  canEditDocuments,
  canViewDocuments,
  listDocuments,
  listDocumentTemplates,
  normalizeDocumentFilter,
} from "@/lib/documents";
import { createAuthClient } from "@/lib/supabase/server-auth";
import type { DocumentCategory } from "@/lib/documents/types";
import { DOCUMENT_CATEGORIES } from "@/lib/documents/types";

interface PageProps {
  searchParams: Promise<{
    filter?: string;
    search?: string;
    category?: string;
    page?: string;
    sort?: string;
    dir?: string;
    create?: string;
    template_id?: string;
    studentId?: string;
    familyId?: string;
    employeeId?: string;
  }>;
}

export default async function DocumentsPage({ searchParams }: PageProps) {
  const identity = await getIdentityContext();
  if (!canViewDocuments(identity)) {
    redirect("/dashboard");
  }

  const sp = await searchParams;
  const filter = normalizeDocumentFilter(sp.filter);
  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const category =
    sp.category && DOCUMENT_CATEGORIES.includes(sp.category as DocumentCategory)
      ? (sp.category as DocumentCategory)
      : "all";
  const sort =
    sp.sort === "created_at" || sp.sort === "title" || sp.sort === "category"
      ? sp.sort
      : "updated_at";
  const sortDir = sp.dir === "asc" ? "asc" : "desc";
  const canEdit = canEditDocuments(identity);
  const schoolId = identity?.accessibleSchoolIds?.[0] ?? null;
  const showCreate = sp.create === "1" && canEdit;

  const supabase = await createAuthClient();
  const [listResult, templates] = await Promise.all([
    filter === "templates"
      ? Promise.resolve({ rows: [], total: 0, page, pageSize: 25 })
      : listDocuments({
          filter,
          search: sp.search ?? "",
          category,
          page,
          pageSize: 25,
          sort,
          sortDir,
          schoolId: identity?.hasUnrestrictedSchoolAccess ? null : schoolId,
          studentId: sp.studentId,
          familyId: sp.familyId,
          employeeId: sp.employeeId,
        }),
    listDocumentTemplates(supabase, {
      schoolId,
      activeOnly: true,
    }),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <PageHeader
        title="Documents & Records"
        subtitle="Versioned documents with entity relationships, templates, and lifecycle management"
        actions={
          canEdit ? (
            <div className="flex flex-wrap gap-2">
              <Link
                href="/dashboard/documents?create=1"
                className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                Upload / Create
              </Link>
              <Link
                href="/dashboard/documents?filter=templates"
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Templates
              </Link>
            </div>
          ) : undefined
        }
      />

      {showCreate ? (
        <CreateDocumentForm
          schoolId={schoolId}
          templateId={sp.template_id}
          templates={templates.map((t) => ({ id: t.id, name: t.name }))}
        />
      ) : null}

      <Suspense fallback={<p className="text-sm text-slate-500">Loading documents…</p>}>
        <DocumentsDashboard
          rows={listResult.rows}
          total={listResult.total}
          page={listResult.page}
          pageSize={listResult.pageSize}
          filter={filter}
          search={sp.search ?? ""}
          category={category}
          sort={sort}
          sortDir={sortDir}
          canEdit={canEdit}
          templates={templates.map((t) => ({
            id: t.id,
            name: t.name,
            category: t.category,
            description: t.description,
          }))}
        />
      </Suspense>
    </div>
  );
}
