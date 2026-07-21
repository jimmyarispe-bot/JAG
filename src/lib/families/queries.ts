import { createAuthClient } from "@/lib/supabase/server-auth";

export type FamilyStatusFilter =
  | "active"
  | "archived"
  | "incomplete"
  | "prospective"
  | "all";

export type FamilySortKey =
  | "family_name"
  | "status"
  | "last_activity"
  | "student_count";

export interface FamilyListRow {
  id: string;
  school_id: string;
  family_name: string;
  household_name: string | null;
  preferred_name: string | null;
  status: string;
  billing_email: string | null;
  billing_phone: string | null;
  primary_address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  preferred_language: string | null;
  preferred_communication_method: string | null;
  timezone: string | null;
  notes: string | null;
  created_at: string | null;
  archived_at: string | null;
  schoolName: string | null;
  primaryGuardianName: string | null;
  primaryGuardianEmail: string | null;
  primaryGuardianPhone: string | null;
  studentCount: number;
  studentNames: string[];
  lastActivityAt: string | null;
}

export interface FamilyListQuery {
  status?: FamilyStatusFilter;
  search?: string;
  sort?: FamilySortKey;
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
  schoolId?: string | null;
}

export interface FamilyListResult {
  rows: FamilyListRow[];
  total: number;
  page: number;
  pageSize: number;
}

function normalizeStatusFilter(raw?: string): FamilyStatusFilter {
  if (
    raw === "archived" ||
    raw === "incomplete" ||
    raw === "prospective" ||
    raw === "all"
  ) {
    return raw;
  }
  return "active";
}

export { normalizeStatusFilter };

/**
 * Family dashboard list with guardian/student aggregations.
 */
export async function listFamiliesForDashboard(
  query: FamilyListQuery = {}
): Promise<FamilyListResult> {
  const supabase = await createAuthClient();
  const status = query.status ?? "active";
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 25));
  const search = (query.search ?? "").trim();
  const sort = query.sort ?? "family_name";
  const sortDir = query.sortDir ?? "asc";

  let request = supabase
    .from("families")
    .select(
      "id, school_id, family_name, household_name, preferred_name, status, billing_email, billing_phone, primary_address, city, state, zip_code, preferred_language, preferred_communication_method, timezone, notes, created_at, updated_at, archived_at, schools(name)",
      { count: "exact" }
    );

  if (status !== "all") {
    request = request.eq("status", status);
  }
  if (query.schoolId) {
    request = request.eq("school_id", query.schoolId);
  }
  if (search) {
    request = request.or(
      `family_name.ilike.%${search}%,household_name.ilike.%${search}%,billing_email.ilike.%${search}%,billing_phone.ilike.%${search}%`
    );
  }

  if (sort === "family_name" || sort === "status") {
    request = request.order(sort, { ascending: sortDir === "asc" });
  } else {
    request = request.order("family_name", { ascending: true });
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await request.range(from, to);

  if (error) {
    console.error("[families] listFamiliesForDashboard:", error.message);
    return { rows: [], total: 0, page, pageSize };
  }

  const families = data ?? [];
  const familyIds = families.map((f) => f.id);
  if (!familyIds.length) {
    return { rows: [], total: count ?? 0, page, pageSize };
  }

  const [guardiansRes, studentsRes, activityRes] = await Promise.all([
    supabase
      .from("guardians")
      .select("id, family_id, first_name, last_name, email, phone, is_primary, is_active")
      .in("family_id", familyIds),
    supabase
      .from("students")
      .select("id, family_id, first_name, last_name, status")
      .in("family_id", familyIds)
      .neq("status", "archived"),
    supabase
      .from("platform_activity_events")
      .select("family_id, occurred_at")
      .in("family_id", familyIds)
      .order("occurred_at", { ascending: false })
      .limit(500),
  ]);

  const primaryByFamily = new Map<
    string,
    { name: string; email: string | null; phone: string | null }
  >();
  for (const g of guardiansRes.data ?? []) {
    if (!g.family_id) continue;
    if (g.is_active === false) continue;
    const existing = primaryByFamily.get(g.family_id);
    if (!existing || g.is_primary) {
      primaryByFamily.set(g.family_id, {
        name: `${g.first_name} ${g.last_name}`.trim(),
        email: g.email,
        phone: g.phone,
      });
    }
  }

  const studentsByFamily = new Map<string, Array<{ id: string; name: string }>>();
  for (const s of studentsRes.data ?? []) {
    if (!s.family_id) continue;
    const list = studentsByFamily.get(s.family_id) ?? [];
    list.push({ id: s.id, name: `${s.first_name} ${s.last_name}`.trim() });
    studentsByFamily.set(s.family_id, list);
  }

  const lastActivityByFamily = new Map<string, string>();
  for (const event of activityRes.data ?? []) {
    if (!event.family_id || lastActivityByFamily.has(event.family_id)) continue;
    lastActivityByFamily.set(event.family_id, event.occurred_at);
  }

  let rows: FamilyListRow[] = families.map((f) => {
    const school = f.schools as { name?: string } | { name?: string }[] | null;
    const schoolName = Array.isArray(school)
      ? school[0]?.name ?? null
      : school?.name ?? null;
    const primary = primaryByFamily.get(f.id);
    const students = studentsByFamily.get(f.id) ?? [];
    return {
      id: f.id,
      school_id: f.school_id,
      family_name: f.family_name,
      household_name: (f as { household_name?: string | null }).household_name ?? null,
      preferred_name: (f as { preferred_name?: string | null }).preferred_name ?? null,
      status: f.status,
      billing_email: f.billing_email,
      billing_phone: f.billing_phone,
      primary_address: f.primary_address,
      city: f.city,
      state: f.state,
      zip_code: f.zip_code,
      preferred_language: (f as { preferred_language?: string | null }).preferred_language ?? null,
      preferred_communication_method:
        (f as { preferred_communication_method?: string | null }).preferred_communication_method ??
        null,
      timezone: (f as { timezone?: string | null }).timezone ?? null,
      notes: (f as { notes?: string | null }).notes ?? null,
      created_at: f.created_at,
      archived_at: (f as { archived_at?: string | null }).archived_at ?? null,
      schoolName,
      primaryGuardianName: primary?.name ?? null,
      primaryGuardianEmail: primary?.email ?? f.billing_email,
      primaryGuardianPhone: primary?.phone ?? f.billing_phone,
      studentCount: students.length,
      studentNames: students.map((s) => s.name),
      lastActivityAt: lastActivityByFamily.get(f.id) ?? f.updated_at ?? f.created_at,
    };
  });

  if (sort === "student_count") {
    rows = [...rows].sort((a, b) =>
      sortDir === "asc" ? a.studentCount - b.studentCount : b.studentCount - a.studentCount
    );
  } else if (sort === "last_activity") {
    rows = [...rows].sort((a, b) => {
      const av = a.lastActivityAt ?? "";
      const bv = b.lastActivityAt ?? "";
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }

  return { rows, total: count ?? rows.length, page, pageSize };
}

export async function getFamilyById(familyId: string) {
  const supabase = await createAuthClient();
  const { data } = await supabase
    .from("families")
    .select("*, schools(name, organization_id)")
    .eq("id", familyId)
    .maybeSingle();
  return data;
}
