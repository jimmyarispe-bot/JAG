/**
 * Student Profile™ — canonical read layer for the SIS.
 * All workspaces consume student data through profile section loaders that delegate here.
 */
import { getStudentEvidenceRecords } from "@/lib/platform/evidence/query";
import {
  getPajJourneyByStudent,
  listPajCompetencyProgress,
  listPajDomainEnrollments,
} from "@/lib/platform/paj/persistence/records";
import { evaluateRuleSet } from "@/lib/platform/rules/engine/execute";
import { getStudentInstructionalTeam } from "@/lib/instruction/growth-plan";
import { getLatestStudentSuccessScore } from "@/lib/ssis/score";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export async function loadStudentLearningJourney(supabase: AuthClient, studentId: string) {
  const journey = await getPajJourneyByStudent(supabase, studentId);
  if (!journey) {
    return { journey: null, domains: [], competencies: [], evidence: [] };
  }

  const [domains, competencies, evidence] = await Promise.all([
    listPajDomainEnrollments(supabase, journey.id),
    listPajCompetencyProgress(supabase, journey.id),
    getStudentEvidenceRecords(supabase, studentId, { limit: 30 }),
  ]);

  return { journey, domains, competencies, evidence };
}

export async function loadStudentInstructionalTeam(supabase: AuthClient, studentId: string) {
  return getStudentInstructionalTeam(supabase, studentId);
}

export async function loadStudentGraduationReadiness(
  supabase: AuthClient,
  studentId: string,
  schoolId?: string | null
) {
  const [successScore, learning] = await Promise.all([
    getLatestStudentSuccessScore(supabase, studentId),
    loadStudentLearningJourney(supabase, studentId),
  ]);

  const proficientCount = learning.competencies.filter(
    (c) => Number(c.mastery_level ?? 0) >= 3
  ).length;
  const topMastery = learning.competencies.reduce(
    (max, c) => Math.max(max, Number(c.mastery_level ?? 0)),
    0
  );
  const evidenceCount = learning.evidence.length;
  const graduationScore = Math.min(
    100,
    Math.round(topMastery * 20 + proficientCount * 8 + evidenceCount * 2)
  );

  let ruleOutcome: string | undefined;
  let explanation: string | undefined;
  try {
    const ruleResult = await evaluateRuleSet(
      {
        ruleSetKey: "ref_graduation_readiness",
        facts: { readiness_score: graduationScore },
        entityType: "student",
        entityId: studentId,
        schoolId: schoolId ?? undefined,
        metadata: { domain: "graduation_readiness" },
      },
      { persist: { supabase }, recordAudit: false }
    );
    ruleOutcome = ruleResult.primaryOutcome?.outcomeKey;
    explanation = ruleResult.explanation.summary;
  } catch {
    // Rules evaluation is best-effort
  }

  return {
    graduationScore,
    ruleOutcome,
    explanation,
    successScore,
    proficientCount,
    evidenceCount,
    journeyStatus: learning.journey?.status ?? null,
  };
}

export async function loadStudentGradeHistory(supabase: AuthClient, studentId: string) {
  const [lifecycle, enrollments, courseEnrollments] = await Promise.all([
    supabase
      .from("ssis_lifecycle_transitions")
      .select("id, from_stage, to_stage, created_at")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false }),
    supabase
      .from("sis_enrollments")
      .select(
        "id, program, enrollment_status, enrolled_at, school_years(name)"
      )
      .eq("student_id", studentId)
      .order("enrolled_at", { ascending: false }),
    supabase
      .from("student_enrollments")
      .select(
        "id, enrollment_status, enrolled_at, course_sections(section_code, courses(name)), school_years(name)"
      )
      .eq("student_id", studentId)
      .order("enrolled_at", { ascending: false }),
  ]);

  return {
    lifecycle: lifecycle.data ?? [],
    enrollments: enrollments.data ?? [],
    courseEnrollments: courseEnrollments.data ?? [],
  };
}

export async function loadStudentBillingSnapshot(
  supabase: AuthClient,
  familyId: string,
  studentId: string
) {
  const { getFamilyFinancialProfile } = await import("@/lib/finance/family-center");
  const profile = await getFamilyFinancialProfile(supabase, familyId);
  if (!profile) return null;

  const studentInvoices = (profile.invoices ?? []).filter(
    (inv: { student_id?: string | null }) => inv.student_id === studentId
  );

  return {
    ...profile,
    studentInvoices,
    studentScholarships: (profile.scholarships ?? []).filter(
      (s: { student_id?: string | null }) => s.student_id === studentId
    ),
  };
}
