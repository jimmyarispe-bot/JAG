import { createAuthClient } from "@/lib/supabase/server-auth";
import type {
  DocumentListFilter,
  DocumentListQuery,
  DocumentListRow,
  DocumentRow,
} from "./types";

export interface DocumentListResult {
  rows: DocumentListRow[];
  total: number;
  page: number;
  pageSize: number;
}

export function normalizeDocumentFilter(raw?: string): DocumentListFilter {
  if (
    raw === "student" ||
    raw === "family" ||
    raw === "employee" ||
    raw === "school" ||
    raw === "templates" ||
    raw === "archived"
  ) {
    return raw;
  }
  return "all";
}

function relatedSummaryFromRelations(
  relations: Array<{ entity_type: string; entity_id: string }> | null | undefined
): string {
  if (!relations?.length) return "—";
  const counts = new Map<string, number>();
  for (const r of relations) {
    counts.set(r.entity_type, (counts.get(r.entity_type) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([type, n]) => `${type}${n > 1 ? `×${n}` : ""}`)
    .join(", ");
}

export async function listDocuments(
  query: DocumentListQuery = {}
): Promise<DocumentListResult> {
  const supabase = await createAuthClient();
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 25));
  const filter = query.filter ?? "all";
  const sort = query.sort ?? "updated_at";
  const sortDir = query.sortDir ?? "desc";
  const search = (query.search ?? "").trim();

  if (filter === "templates") {
    return { rows: [], total: 0, page, pageSize };
  }

  let request = supabase
    .from("platform_documents")
    .select(
      "*, schools(name), users!platform_documents_owner_user_id_fkey(full_name), platform_document_relations(entity_type, entity_id)",
      { count: "exact" }
    );

  if (query.schoolId) request = request.eq("school_id", query.schoolId);
  if (query.category && query.category !== "all") {
    request = request.eq("category", query.category);
  }

  if (filter === "archived") {
    request = request.eq("status", "archived");
  } else {
    request = request.neq("status", "archived");
  }

  if (search) {
    request = request.or(
      `title.ilike.%${search}%,description.ilike.%${search}%,file_name.ilike.%${search}%,category.ilike.%${search}%`
    );
  }

  // Relation filters — fetch matching document ids first when needed
  const relationType =
    filter === "student" ||
    filter === "family" ||
    filter === "employee" ||
    filter === "school"
      ? filter
      : null;

  const specificEntityId =
    query.studentId || query.familyId || query.employeeId || null;

  if (relationType || specificEntityId) {
    let relQuery = supabase
      .from("platform_document_relations")
      .select("document_id");
    if (relationType) relQuery = relQuery.eq("entity_type", relationType);
    if (query.studentId) {
      relQuery = relQuery.eq("entity_type", "student").eq("entity_id", query.studentId);
    } else if (query.familyId) {
      relQuery = relQuery.eq("entity_type", "family").eq("entity_id", query.familyId);
    } else if (query.employeeId) {
      relQuery = relQuery.eq("entity_type", "employee").eq("entity_id", query.employeeId);
    }
    const { data: relRows } = await relQuery;
    const ids = Array.from(new Set((relRows ?? []).map((r) => r.document_id as string)));
    if (!ids.length) return { rows: [], total: 0, page, pageSize };
    request = request.in("id", ids);
  }

  request = request.order(sort, { ascending: sortDir === "asc" });
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await request.range(from, to);

  if (error) {
    // Fallback without FK joins if relation names differ
    console.error("[documents] listDocuments:", error.message);
    const fallback = await supabase
      .from("platform_documents")
      .select("*", { count: "exact" })
      .order(sort, { ascending: sortDir === "asc" })
      .range(from, to);
    const rows = ((fallback.data ?? []) as DocumentRow[]).map((row) => ({
      ...row,
      tags: row.tags ?? [],
      schoolName: null,
      ownerName: null,
      relatedSummary: "—",
    }));
    return { rows, total: fallback.count ?? rows.length, page, pageSize };
  }

  type Raw = DocumentRow & {
    schools?: { name: string } | null;
    users?: { full_name: string } | null;
    platform_document_relations?: Array<{ entity_type: string; entity_id: string }>;
  };

  const rows: DocumentListRow[] = ((data ?? []) as Raw[]).map((row) => ({
    ...row,
    tags: row.tags ?? [],
    schoolName: row.schools?.name ?? null,
    ownerName: row.users?.full_name ?? null,
    relatedSummary: relatedSummaryFromRelations(row.platform_document_relations),
  }));

  return { rows, total: count ?? rows.length, page, pageSize };
}

export async function searchDocumentsMetadata(
  search: string,
  options?: { schoolId?: string | null; page?: number; pageSize?: number }
): Promise<DocumentListResult> {
  return listDocuments({
    search,
    schoolId: options?.schoolId,
    page: options?.page,
    pageSize: options?.pageSize,
    filter: "all",
  });
}
