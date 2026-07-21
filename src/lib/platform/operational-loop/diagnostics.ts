import type { createAuthClient } from "@/lib/supabase/server-auth";
import {
  getCompletedTransitionKeys,
  getStudentLoopAuditTrail,
} from "@/lib/platform/operational-loop/audit";
import {
  LOOP_TRANSITION_REGISTRY,
  getLoopTransition,
} from "@/lib/platform/operational-loop/registry";
import type {
  LoopGapReport,
  LoopTransitionDiagnostic,
  OperationalLoopStage,
  OperationalLoopTransitionKey,
} from "@/lib/platform/operational-loop/types";
import { OPERATIONAL_LOOP_STAGES } from "@/lib/platform/operational-loop/types";
import { getActiveWorkflowInstance } from "@/lib/platform/workflow/persistence/instances";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

async function checkStageEvidence(
  supabase: AuthClient,
  studentId: string,
  stage: OperationalLoopStage
): Promise<{ ok: boolean; reason: string }> {
  switch (stage) {
    case "admissions": {
      const { data: student } = await supabase
        .from("students")
        .select("admissions_lead_id")
        .eq("id", studentId)
        .maybeSingle();
      return student?.admissions_lead_id
        ? { ok: true, reason: "Admissions lead linked" }
        : { ok: false, reason: "No admissions lead on student record" };
    }
    case "enrollment": {
      const { data: student } = await supabase
        .from("students")
        .select("enrollment_status, lifecycle_stage")
        .eq("id", studentId)
        .maybeSingle();
      return student?.lifecycle_stage === "active" || student?.enrollment_status === "enrolled"
        ? { ok: true, reason: "Student active/enrolled" }
        : { ok: false, reason: "Enrollment activation incomplete" };
    }
    case "scheduling": {
      const { count } = await supabase
        .from("student_enrollments")
        .select("id", { count: "exact", head: true })
        .eq("student_id", studentId)
        .in("enrollment_status", ["enrolled", "waitlisted"]);
      return (count ?? 0) > 0
        ? { ok: true, reason: "Section enrollment exists" }
        : { ok: false, reason: "No section placement" };
    }
    case "instruction": {
      const { data: enrollments } = await supabase
        .from("student_enrollments")
        .select("course_section_id")
        .eq("student_id", studentId)
        .eq("enrollment_status", "enrolled");
      const sectionIds = (enrollments ?? []).map((e) => e.course_section_id).filter(Boolean);
      if (!sectionIds.length) {
        return { ok: false, reason: "No section enrollment for sessions" };
      }
      const { count } = await supabase
        .from("instructional_sessions")
        .select("id", { count: "exact", head: true })
        .in("course_section_id", sectionIds);
      return (count ?? 0) > 0
        ? { ok: true, reason: "Instructional sessions scheduled" }
        : { ok: false, reason: "No instructional sessions" };
    }
    case "evidence": {
      const { count: artifactCount } = await supabase
        .from("student_learning_artifacts")
        .select("id", { count: "exact", head: true })
        .eq("student_id", studentId);
      const { count: platformEvidence } = await supabase
        .from("platform_evidence_records")
        .select("id", { count: "exact", head: true })
        .eq("student_id", studentId);
      return (artifactCount ?? 0) > 0 || (platformEvidence ?? 0) > 0
        ? { ok: true, reason: "Learning evidence recorded" }
        : { ok: false, reason: "No artifacts or platform evidence" };
    }
    case "progress": {
      const { data: journey } = await supabase
        .from("platform_paj_journeys")
        .select("id")
        .eq("student_id", studentId)
        .maybeSingle();
      if (!journey) return { ok: false, reason: "No PAJ journey" };
      const { count } = await supabase
        .from("platform_paj_placements")
        .select("id", { count: "exact", head: true })
        .eq("journey_id", journey.id);
      return (count ?? 0) > 0
        ? { ok: true, reason: "PAJ placement recorded" }
        : { ok: false, reason: "No PAJ placement" };
    }
    case "parent_communication": {
      const { count } = await supabase
        .from("ssis_communication_events")
        .select("id", { count: "exact", head: true })
        .eq("student_id", studentId);
      return (count ?? 0) > 0
        ? { ok: true, reason: "Family communication logged" }
        : { ok: false, reason: "No parent communication events" };
    }
    case "billing": {
      const { count } = await supabase
        .from("invoices")
        .select("id", { count: "exact", head: true })
        .eq("student_id", studentId);
      return (count ?? 0) > 0
        ? { ok: true, reason: "Billing invoice exists" }
        : { ok: false, reason: "No tuition invoice" };
    }
    default:
      return { ok: false, reason: "Unknown stage" };
  }
}

/** Per-student gap report — incomplete handoffs across the loop. */
export async function generateStudentLoopGapReport(
  supabase: AuthClient,
  studentId: string
): Promise<LoopGapReport | null> {
  const { data: student } = await supabase
    .from("students")
    .select("id, first_name, last_name, school_id, lifecycle_stage")
    .eq("id", studentId)
    .maybeSingle();

  if (!student) return null;

  // P004: instance / completed / trail are independent after student load.
  const [instance, completed, trail] = await Promise.all([
    getActiveWorkflowInstance(supabase, {
      domain: "sis",
      entityType: "student",
      entityId: studentId,
    }),
    getCompletedTransitionKeys(supabase, studentId),
    getStudentLoopAuditTrail(supabase, studentId, 20),
  ]);
  const failedByKey = new Map(
    trail.filter((t) => t.status === "failed").map((t) => [t.transitionKey, t])
  );

  const transitionKeys = Object.keys(
    LOOP_TRANSITION_REGISTRY
  ) as OperationalLoopTransitionKey[];

  // P004: stage evidence checks are independent per transition.
  const stageChecks = await Promise.all(
    transitionKeys.map((key) => {
      const def = getLoopTransition(key);
      return checkStageEvidence(supabase, studentId, def.toStage);
    })
  );

  const diagnostics: LoopTransitionDiagnostic[] = [];
  const gaps: LoopGapReport["gaps"] = [];

  for (let i = 0; i < transitionKeys.length; i++) {
    const key = transitionKeys[i];
    const def = getLoopTransition(key);
    const failed = failedByKey.get(key);
    const completedOk = completed.has(key);
    const stageCheck = stageChecks[i];

    let status: LoopTransitionDiagnostic["status"] = "unknown";
    if (failed) status = "failed";
    else if (completedOk && stageCheck.ok) status = "complete";
    else if (completedOk && !stageCheck.ok) status = "missing";
    else if (!completedOk && stageCheck.ok) status = "complete";
    else status = "missing";

    diagnostics.push({
      transitionKey: key,
      stage: def.toStage,
      status,
      lastAttemptAt: trail.find((t) => t.transitionKey === key)?.createdAt,
      lastError: failed?.errors.join("; "),
      evidence: stageCheck.reason,
    });

    if (status === "missing" || status === "failed") {
      gaps.push({
        transitionKey: key,
        label: def.label,
        reason:
          status === "failed"
            ? (failed?.errors.join("; ") ?? "Transition failed")
            : stageCheck.reason,
        severity:
          def.toStage === "enrollment" || def.toStage === "scheduling"
            ? "critical"
            : status === "failed"
              ? "warning"
              : "info",
      });
    }
  }

  const completeCount = diagnostics.filter((d) => d.status === "complete").length;
  const completenessPct = Math.round(
    (completeCount / OPERATIONAL_LOOP_STAGES.length) * 100
  );

  const facts = (instance?.facts ?? {}) as { cycleNumber?: number };

  return {
    studentId,
    studentName: `${student.first_name} ${student.last_name}`,
    schoolId: student.school_id,
    currentStage: (instance?.current_state_key as OperationalLoopStage) ?? null,
    cycleNumber: facts.cycleNumber ?? 1,
    diagnostics,
    gaps,
    completenessPct,
  };
}

/** School-wide gap report for executive dashboard. */
export async function generateSchoolLoopGapReport(
  supabase: AuthClient,
  schoolId: string,
  limit = 25
): Promise<LoopGapReport[]> {
  const { data: students } = await supabase
    .from("students")
    .select("id")
    .eq("school_id", schoolId)
    .eq("lifecycle_stage", "active")
    .limit(limit);

  // P004: per-student gap reports are independent.
  const reports = (
    await Promise.all(
      (students ?? []).map((s) => generateStudentLoopGapReport(supabase, s.id))
    )
  ).filter((report): report is LoopGapReport => Boolean(report && report.gaps.length > 0));

  return reports.sort((a, b) => a.completenessPct - b.completenessPct);
}

/** Transition diagnostics for a single transition key across students. */
export async function diagnoseLoopTransition(
  supabase: AuthClient,
  schoolId: string,
  transitionKey: OperationalLoopTransitionKey
): Promise<{ transitionKey: OperationalLoopTransitionKey; failed: number; missing: number; complete: number }> {
  const { data: students } = await supabase
    .from("students")
    .select("id")
    .eq("school_id", schoolId)
    .eq("lifecycle_stage", "active");

  let failed = 0;
  let missing = 0;
  let complete = 0;

  // P004: per-student diagnostics are independent.
  const reports = await Promise.all(
    (students ?? []).map((s) => generateStudentLoopGapReport(supabase, s.id))
  );

  for (const report of reports) {
    if (!report) continue;
    const diag = report.diagnostics.find((d) => d.transitionKey === transitionKey);
    if (!diag) continue;
    if (diag.status === "failed") failed++;
    else if (diag.status === "complete") complete++;
    else missing++;
  }

  return { transitionKey, failed, missing, complete };
}
