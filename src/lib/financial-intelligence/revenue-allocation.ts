import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export type SectionRevenueResult = {
  revenue: number;
  scholarships: number;
  stateFunding: number;
  enrollment: number;
};

export async function getSectionRevenue(
  supabase: AuthClient,
  sectionId: string,
  periodStart: string,
  periodEnd: string
): Promise<SectionRevenueResult> {
  const map = await getSectionsRevenue(supabase, [sectionId], periodStart, periodEnd);
  return map.get(sectionId) ?? { revenue: 0, scholarships: 0, stateFunding: 0, enrollment: 0 };
}

/** Sprint P003 — batch section revenue to eliminate per-section N+1. */
export async function getSectionsRevenue(
  supabase: AuthClient,
  sectionIds: string[],
  periodStart: string,
  periodEnd: string
): Promise<Map<string, SectionRevenueResult>> {
  const result = new Map<string, SectionRevenueResult>();
  for (const id of sectionIds) {
    result.set(id, { revenue: 0, scholarships: 0, stateFunding: 0, enrollment: 0 });
  }
  if (!sectionIds.length) return result;

  const { data: enrollments } = await supabase
    .from("student_enrollments")
    .select("student_id, course_section_id, students(family_id)")
    .in("course_section_id", sectionIds)
    .eq("enrollment_status", "enrolled");

  const studentsBySection = new Map<string, string[]>();
  const allStudentIds = new Set<string>();
  for (const e of enrollments ?? []) {
    if (!e.course_section_id || !e.student_id) continue;
    const list = studentsBySection.get(e.course_section_id) ?? [];
    list.push(e.student_id);
    studentsBySection.set(e.course_section_id, list);
    allStudentIds.add(e.student_id);
  }

  for (const [sectionId, studentIds] of studentsBySection) {
    result.set(sectionId, {
      revenue: 0,
      scholarships: 0,
      stateFunding: 0,
      enrollment: studentIds.length,
    });
  }

  if (!allStudentIds.size) return result;

  const { data: invoices } = await supabase
    .from("invoices")
    .select("total_amount, amount_paid, scholarship_credit, state_funding_credit, student_id")
    .in("student_id", [...allStudentIds])
    .gte("due_date", periodStart)
    .lte("due_date", periodEnd)
    .not("invoice_status", "eq", "void");

  const invoicesByStudent = new Map<string, typeof invoices>();
  for (const inv of invoices ?? []) {
    if (!inv.student_id) continue;
    const list = invoicesByStudent.get(inv.student_id) ?? [];
    list.push(inv);
    invoicesByStudent.set(inv.student_id, list);
  }

  for (const [sectionId, studentIds] of studentsBySection) {
    let revenue = 0;
    let scholarships = 0;
    let stateFunding = 0;
    for (const sid of studentIds) {
      for (const inv of invoicesByStudent.get(sid) ?? []) {
        revenue += Number(inv.total_amount);
        scholarships += Number(inv.scholarship_credit ?? 0);
        stateFunding += Number(inv.state_funding_credit ?? 0);
      }
    }
    result.set(sectionId, { revenue, scholarships, stateFunding, enrollment: studentIds.length });
  }

  return result;
}

export async function getProgramRevenue(
  supabase: AuthClient,
  schoolId: string,
  program: string,
  periodStart: string,
  periodEnd: string
) {
  const { data: invoices } = await supabase
    .from("invoices")
    .select(`
      total_amount, scholarship_credit, state_funding_credit, grant_credit,
      family_billing_accounts!inner(school_id)
    `)
    .eq("program", program)
    .eq("family_billing_accounts.school_id", schoolId)
    .gte("due_date", periodStart)
    .lte("due_date", periodEnd)
    .not("invoice_status", "eq", "void");

  return {
    revenue: (invoices ?? []).reduce((s, i) => s + Number(i.total_amount), 0),
    scholarships: (invoices ?? []).reduce((s, i) => s + Number(i.scholarship_credit ?? 0), 0),
    stateFunding: (invoices ?? []).reduce((s, i) => s + Number(i.state_funding_credit ?? 0), 0),
    grants: (invoices ?? []).reduce((s, i) => s + Number(i.grant_credit ?? 0), 0),
  };
}

export type StudentRevenueResult = {
  tuition: number;
  scholarships: number;
  esa: number;
  stateFunding: number;
  grants: number;
  totalRevenue: number;
};

export async function getStudentRevenue(supabase: AuthClient, studentId: string) {
  const map = await getStudentsRevenue(supabase, [studentId]);
  return (
    map.get(studentId) ?? {
      tuition: 0,
      scholarships: 0,
      esa: 0,
      stateFunding: 0,
      grants: 0,
      totalRevenue: 0,
    }
  );
}

/** Sprint P003 — batch student revenue for economics reports. */
export async function getStudentsRevenue(
  supabase: AuthClient,
  studentIds: string[]
): Promise<Map<string, StudentRevenueResult>> {
  const result = new Map<string, StudentRevenueResult>();
  for (const id of studentIds) {
    result.set(id, {
      tuition: 0,
      scholarships: 0,
      esa: 0,
      stateFunding: 0,
      grants: 0,
      totalRevenue: 0,
    });
  }
  if (!studentIds.length) return result;

  const [{ data: invoices }, { data: funding }, { data: scholarships }] = await Promise.all([
    supabase
      .from("invoices")
      .select("student_id, total_amount, scholarship_credit, state_funding_credit, grant_credit, amount_paid")
      .in("student_id", studentIds)
      .not("invoice_status", "eq", "void"),
    supabase
      .from("ssis_student_funding_records")
      .select("student_id, award_amount, funding_category")
      .in("student_id", studentIds),
    supabase
      .from("scholarship_applications")
      .select("student_id, approved_amount")
      .in("student_id", studentIds)
      .eq("scholarship_status", "approved"),
  ]);

  const invoicesByStudent = new Map<string, NonNullable<typeof invoices>>();
  for (const inv of invoices ?? []) {
    if (!inv.student_id) continue;
    const list = invoicesByStudent.get(inv.student_id) ?? [];
    list.push(inv);
    invoicesByStudent.set(inv.student_id, list);
  }

  const fundingByStudent = new Map<string, NonNullable<typeof funding>>();
  for (const row of funding ?? []) {
    if (!row.student_id) continue;
    const list = fundingByStudent.get(row.student_id) ?? [];
    list.push(row);
    fundingByStudent.set(row.student_id, list);
  }

  const scholarshipsByStudent = new Map<string, NonNullable<typeof scholarships>>();
  for (const row of scholarships ?? []) {
    if (!row.student_id) continue;
    const list = scholarshipsByStudent.get(row.student_id) ?? [];
    list.push(row);
    scholarshipsByStudent.set(row.student_id, list);
  }

  for (const id of studentIds) {
    const inv = invoicesByStudent.get(id) ?? [];
    const fund = fundingByStudent.get(id) ?? [];
    const sch = scholarshipsByStudent.get(id) ?? [];

    const tuition = inv.reduce((s, i) => s + Number(i.total_amount), 0);
    const scholarshipTotal =
      inv.reduce((s, i) => s + Number(i.scholarship_credit ?? 0), 0) +
      sch.reduce((s, i) => s + Number(i.approved_amount ?? 0), 0);
    const stateFunding = inv.reduce((s, i) => s + Number(i.state_funding_credit ?? 0), 0);
    const esa = fund
      .filter((f) => String(f.funding_category).includes("esa"))
      .reduce((s, f) => s + Number(f.award_amount ?? 0), 0);
    const grants = inv.reduce((s, i) => s + Number(i.grant_credit ?? 0), 0);

    result.set(id, {
      tuition,
      scholarships: scholarshipTotal,
      esa,
      stateFunding,
      grants,
      totalRevenue: tuition,
    });
  }

  return result;
}
