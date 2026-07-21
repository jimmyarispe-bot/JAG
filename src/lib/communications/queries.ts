import { createAuthClient } from "@/lib/supabase/server-auth";
import type {
  CommunicationFilter,
  CommunicationListRow,
  CommunicationTemplateRow,
  CommunicationType,
} from "./types";

export interface CommunicationListQuery {
  filter?: CommunicationFilter;
  type?: CommunicationType | "all";
  search?: string;
  schoolId?: string | null;
  studentId?: string | null;
  familyId?: string | null;
  staffUserId?: string | null;
  sort?: "created_at" | "subject" | "status" | "type";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface CommunicationListResult {
  rows: CommunicationListRow[];
  total: number;
  page: number;
  pageSize: number;
}

export function normalizeCommunicationFilter(raw?: string): CommunicationFilter {
  if (
    raw === "today" ||
    raw === "unread" ||
    raw === "scheduled" ||
    raw === "failed" ||
    raw === "sent" ||
    raw === "draft"
  ) {
    return raw;
  }
  return "all";
}

export async function listCommunications(
  query: CommunicationListQuery = {}
): Promise<CommunicationListResult> {
  const supabase = await createAuthClient();
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 25));
  const filter = query.filter ?? "all";
  const sort = query.sort ?? "created_at";
  const sortDir = query.sortDir ?? "desc";
  const search = (query.search ?? "").trim();

  let request = supabase
    .from("platform_communications")
    .select(
      "*, schools(name), students(first_name, last_name), families(family_name)",
      { count: "exact" }
    );

  if (query.type && query.type !== "all") {
    request = request.eq("type", query.type);
  }
  if (query.schoolId) request = request.eq("school_id", query.schoolId);
  if (query.studentId) request = request.eq("student_id", query.studentId);
  if (query.familyId) request = request.eq("family_id", query.familyId);
  if (query.staffUserId) request = request.eq("sender_user_id", query.staffUserId);

  if (filter === "today") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    request = request.gte("created_at", start.toISOString());
  } else if (filter === "unread") {
    request = request.is("read_at", null).in("status", ["sent", "delivered"]);
  } else if (filter === "scheduled") {
    request = request.eq("status", "scheduled");
  } else if (filter === "failed") {
    request = request.eq("status", "failed");
  } else if (filter === "sent") {
    request = request.eq("status", "sent");
  } else if (filter === "draft") {
    request = request.eq("status", "draft");
  }

  if (search) {
    request = request.or(
      `subject.ilike.%${search}%,body_text.ilike.%${search}%,sender_display_name.ilike.%${search}%`
    );
  }

  request = request.order(sort, { ascending: sortDir === "asc" });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await request.range(from, to);

  if (error) {
    console.error("[communications] listCommunications:", error.message);
    return { rows: [], total: 0, page, pageSize };
  }

  const ids = (data ?? []).map((r) => r.id);
  const recipientMap = new Map<string, string>();
  if (ids.length) {
    const { data: recipients } = await supabase
      .from("platform_communication_recipients")
      .select("communication_id, display_name, email")
      .in("communication_id", ids);
    for (const r of recipients ?? []) {
      const label = r.display_name || r.email || "Recipient";
      const prev = recipientMap.get(r.communication_id);
      recipientMap.set(
        r.communication_id,
        prev ? `${prev}, ${label}` : label
      );
    }
  }

  const rows: CommunicationListRow[] = (data ?? []).map((row) => {
    const school = row.schools as { name?: string } | { name?: string }[] | null;
    const student = row.students as
      | { first_name?: string; last_name?: string }
      | { first_name?: string; last_name?: string }[]
      | null;
    const family = row.families as
      | { family_name?: string }
      | { family_name?: string }[]
      | null;

    const schoolName = Array.isArray(school)
      ? school[0]?.name ?? null
      : school?.name ?? null;
    const studentObj = Array.isArray(student) ? student[0] : student;
    const familyObj = Array.isArray(family) ? family[0] : family;

    return {
      ...(row as unknown as CommunicationListRow),
      schoolName,
      studentName: studentObj
        ? `${studentObj.first_name ?? ""} ${studentObj.last_name ?? ""}`.trim()
        : null,
      familyName: familyObj?.family_name ?? null,
      recipientSummary: recipientMap.get(row.id) ?? "—",
    };
  });

  return { rows, total: count ?? rows.length, page, pageSize };
}

export async function getCommunicationById(id: string) {
  const supabase = await createAuthClient();
  const { data } = await supabase
    .from("platform_communications")
    .select(
      "*, schools(name), students(first_name, last_name), families(family_name), platform_communication_recipients(*), platform_communication_attachments(*)"
    )
    .eq("id", id)
    .maybeSingle();
  return data;
}

export async function listTemplates(options: {
  organizationId?: string | null;
  includeGlobal?: boolean;
} = {}): Promise<CommunicationTemplateRow[]> {
  const supabase = await createAuthClient();
  let q = supabase
    .from("platform_communication_templates")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (options.organizationId) {
    q = options.includeGlobal !== false
      ? q.or(`organization_id.eq.${options.organizationId},organization_id.is.null`)
      : q.eq("organization_id", options.organizationId);
  } else {
    q = q.is("organization_id", null);
  }

  const { data } = await q;
  return (data ?? []) as CommunicationTemplateRow[];
}

export async function getTemplateById(id: string) {
  const supabase = await createAuthClient();
  const { data } = await supabase
    .from("platform_communication_templates")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data as CommunicationTemplateRow | null;
}
