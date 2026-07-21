import type { createAuthClient } from "@/lib/supabase/server-auth";
import type { StudentDependencyHit, StudentDependencyReport, StudentImportOrigin } from "./types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

interface DependencyProbe {
  key: string;
  label: string;
  table: string;
  column?: string;
  blocking: boolean;
}

const PROBES: DependencyProbe[] = [
  { key: "attendance", label: "Attendance", table: "student_attendance_records", blocking: true },
  { key: "period_attendance", label: "Period attendance", table: "student_period_attendance", blocking: true },
  { key: "session_attendance", label: "Session attendance", table: "session_attendance_records", blocking: true },
  { key: "grades", label: "Grades", table: "student_academic_grades", blocking: true },
  { key: "progress", label: "Progress", table: "structured_literacy_progress", blocking: true },
  { key: "scholarships", label: "Scholarships", table: "scholarship_applications", blocking: true },
  { key: "invoices", label: "Billing / invoices", table: "invoices", blocking: true },
  { key: "payments", label: "Payments", table: "financial_transactions", blocking: true },
  { key: "classes", label: "Classes", table: "student_enrollments", blocking: true },
  { key: "sis_enrollments", label: "SIS enrollments", table: "sis_enrollments", blocking: true },
  { key: "assessments", label: "Assessments", table: "session_assessment_records", blocking: true },
  { key: "learning", label: "Learning records", table: "student_learning_profiles", blocking: true },
  { key: "communications", label: "Communications", table: "ssis_communication_logs", blocking: true },
  { key: "documents", label: "Documents", table: "student_documents", blocking: true },
  { key: "family_links", label: "Family links", table: "student_family_link", blocking: true },
  { key: "timesheets", label: "Timesheets", table: "payroll_cost_allocations", blocking: true },
  // Informational — do not block permanent delete
  { key: "audit_logs", label: "Audit logs", table: "platform_activity_events", blocking: false },
  { key: "import_jobs", label: "Import jobs", table: "platform_import_transactions", column: "entity_id", blocking: false },
];

async function countEq(
  supabase: AuthClient,
  table: string,
  column: string,
  value: string
): Promise<number> {
  try {
    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true })
      .eq(column, value);
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function inspectStudentDependencies(
  supabase: AuthClient,
  studentId: string,
  familyId?: string | null
): Promise<StudentDependencyReport> {
  const blocking: StudentDependencyHit[] = [];
  const informational: StudentDependencyHit[] = [];

  if (familyId) {
    blocking.push({ key: "family", label: "Family", count: 1 });
  }

  // Parent/guardian links via family
  if (familyId) {
    const guardianCount = await countEq(supabase, "guardians", "family_id", familyId);
    if (guardianCount > 0) {
      blocking.push({ key: "parents", label: "Parent links", count: guardianCount });
    }
  }

  await Promise.all(
    PROBES.map(async (probe) => {
      const column = probe.column ?? "student_id";
      const count = await countEq(supabase, probe.table, column, studentId);
      if (count <= 0) return;
      const hit = { key: probe.key, label: probe.label, count };
      if (probe.blocking) blocking.push(hit);
      else informational.push(hit);
    })
  );

  // Deduplicate by key (family/parents may overlap conceptually)
  const dedupe = (items: StudentDependencyHit[]) => {
    const map = new Map<string, StudentDependencyHit>();
    for (const item of items) {
      const prev = map.get(item.key);
      if (!prev || item.count > prev.count) map.set(item.key, item);
    }
    return [...map.values()];
  };

  const blockingDeduped = dedupe(blocking);
  return {
    studentId,
    blocking: blockingDeduped,
    informational: dedupe(informational),
    canDelete: blockingDeduped.length === 0,
  };
}

export async function findStudentImportOrigin(
  supabase: AuthClient,
  studentId: string
): Promise<StudentImportOrigin | null> {
  const { data: tx } = await supabase
    .from("platform_import_transactions")
    .select("job_id, created_at")
    .eq("entity_type", "student")
    .eq("entity_id", studentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!tx?.job_id) return null;

  const { data: job } = await supabase
    .from("platform_import_jobs")
    .select("id, started_at, file_name")
    .eq("id", tx.job_id)
    .maybeSingle();

  return {
    jobId: tx.job_id,
    importDate: job?.started_at ?? tx.created_at ?? null,
    fileName: job?.file_name ?? null,
  };
}
