import { buildOperationalReadinessSnapshot } from "@/lib/instruction/readiness";
import { searchEvidenceLibrary } from "@/lib/instruction/evidence";
import { executeWorkspace } from "@/lib/platform/execution-engine";
import { getStudentEvidenceRecords } from "@/lib/platform/evidence/query";
import { getCompetencyGuidance } from "@/lib/platform/paj/guidance";
import { getPajJourneyByStudent } from "@/lib/platform/paj/persistence/records";
import { getJourneySnapshot } from "@/lib/platform/paj/query/journey";
import { evaluateJourneyRecommendations } from "@/lib/platform/paj/recommendations";
import { buildPrerequisiteGraph } from "@/lib/platform/jag-profile/prerequisite";
import type {
  JagProfile,
  JagProfileAi,
  JagProfileAiRecommendation,
  JagProfileEvidence,
  JagProfileIdentity,
  JagProfileInstruction,
  JagProfileLearning,
  JagProfileReadiness,
  JagProfileSection,
  ResolveJagProfileOptions,
} from "@/lib/platform/jag-profile/types";
import { evaluateRuleSet } from "@/lib/platform/rules/engine/execute";
import { getUlrCompetency } from "@/lib/platform/ulr/registry/registry";
import {
  getEnrollmentsByStudent,
  getGuardiansByFamily,
  getStudentById,
} from "@/lib/students/queries";
import { getLatestStudentSuccessScore } from "@/lib/ssis/score";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

const ALL_SECTIONS: JagProfileSection[] = [
  "identity",
  "learning",
  "instruction",
  "evidence",
  "readiness",
  "ai",
];

function includesSection(sections: JagProfileSection[], key: JagProfileSection): boolean {
  return sections.includes(key);
}

async function resolveIdentity(
  supabase: AuthClient,
  studentId: string,
  permissions: string[]
): Promise<JagProfileIdentity> {
  const student = await getStudentById(studentId);
  if (!student) {
    return {
      studentId,
      displayName: "Unknown learner",
      preferredName: null,
      demographics: {
        dateOfBirth: null,
        gradeLevel: null,
        gender: null,
        studentNumber: null,
        photoUrl: null,
      },
      enrollment: {
        status: "unknown",
        program: null,
        lifecycleStage: null,
        graduationYear: null,
        sisEnrollments: [],
        courseSections: [],
      },
      family: { familyId: null, familyName: null, guardians: [] },
      campuses: { schoolId: "", schoolName: null, campusName: null },
      permissions,
    };
  }

  const [sisEnrollments, courseEnrollments, guardians] = await Promise.all([
    getEnrollmentsByStudent(studentId),
    supabase
      .from("student_enrollments")
      .select("enrollment_status, course_sections(section_code, courses(name))")
      .eq("student_id", studentId)
      .eq("enrollment_status", "enrolled"),
    student.family_id ? getGuardiansByFamily(student.family_id) : Promise.resolve([]),
  ]);

  const courseSections = (courseEnrollments.data ?? []).map((row) => {
    const cs = Array.isArray(row.course_sections) ? row.course_sections[0] : row.course_sections;
    const course = cs?.courses;
    const c = Array.isArray(course) ? course[0] : course;
    return {
      sectionCode: (cs as { section_code?: string })?.section_code,
      courseName: (c as { name?: string })?.name,
      status: row.enrollment_status,
    };
  });

  return {
    studentId,
    displayName: `${student.first_name} ${student.last_name}`.trim(),
    preferredName: student.preferred_name,
    demographics: {
      dateOfBirth: student.date_of_birth,
      gradeLevel: student.grade_level,
      gender: student.gender,
      studentNumber: student.student_number,
      photoUrl: student.photo_url,
    },
    enrollment: {
      status: student.enrollment_status,
      program: student.program,
      lifecycleStage: student.lifecycle_stage ?? null,
      graduationYear: student.graduation_year,
      sisEnrollments: sisEnrollments.map((e) => ({
        program: e.program,
        status: e.enrollment_status,
        schoolYear: (Array.isArray(e.school_years) ? e.school_years[0] : e.school_years)?.name ?? null,
      })),
      courseSections,
    },
    family: {
      familyId: student.family_id,
      familyName: student.families?.family_name ?? null,
      guardians: guardians.map((g) => ({
        id: g.id,
        name: `${g.first_name} ${g.last_name}`.trim(),
        email: g.email,
        phone: g.phone,
        relationship: g.relationship_to_student,
        isPrimary: g.is_primary,
      })),
    },
    campuses: {
      schoolId: student.school_id,
      schoolName: student.schools?.name ?? null,
      campusName: student.campuses?.name ?? null,
    },
    permissions,
  };
}

async function resolveLearning(supabase: AuthClient, studentId: string): Promise<JagProfileLearning> {
  const journeyRecord = await getPajJourneyByStudent(supabase, studentId);
  const journey = journeyRecord ? await getJourneySnapshot(supabase, journeyRecord.id) : null;
  const activeCompetencyKey = journey?.activeCompetencyKey ?? null;
  const activeCompetency = activeCompetencyKey ? getUlrCompetency(activeCompetencyKey) ?? null : null;
  const activeCompetencyProgress =
    journey?.competencyProgress.find((p) => p.competency_key === activeCompetencyKey) ?? null;

  const proficientKeys = new Set(
    (journey?.competencyProgress ?? [])
      .filter((p) => p.mastery_level >= 3 || p.status === "proficient")
      .map((p) => p.competency_key)
  );

  const prerequisite = activeCompetencyKey
    ? buildPrerequisiteGraph(activeCompetencyKey, proficientKeys)
    : { ok: true, missing: [] as string[], chain: [] };

  const competencyHistory = (journey?.competencyProgress ?? []).map((p) => {
    const def = getUlrCompetency(p.competency_key);
    return {
      competencyKey: p.competency_key,
      title: def?.title ?? p.competency_key,
      masteryLevel: p.mastery_level,
      status: p.status,
    };
  });

  const proficientCount = competencyHistory.filter(
    (c) => c.masteryLevel >= 3 || c.status === "proficient"
  ).length;
  const inProgressCount = competencyHistory.filter(
    (c) => c.masteryLevel > 0 && c.masteryLevel < 3 && c.status !== "proficient"
  ).length;

  return {
    journey,
    activeCompetency,
    activeCompetencyProgress,
    competencyHistory,
    masterySummary: {
      proficientCount,
      inProgressCount,
      totalTracked: competencyHistory.length,
    },
    prerequisiteGraph: prerequisite.chain,
    prerequisiteStatus: { ok: prerequisite.ok, missing: prerequisite.missing },
  };
}

async function resolveInstruction(
  supabase: AuthClient,
  studentId: string,
  options: ResolveJagProfileOptions,
  learning: JagProfileLearning,
  operational: Awaited<ReturnType<typeof buildOperationalReadinessSnapshot>>
): Promise<JagProfileInstruction> {
  const activeCompetencyKey = learning.activeCompetency?.competencyKey ?? null;

  let engineRecommendations: JagProfileInstruction["engineRecommendations"] = [];
  if (options.identity) {
    try {
      const execution = await executeWorkspace({
        workspaceKey: options.workspaceKey ?? "teacher",
        identity: options.identity,
        activeView: options.activeView ?? "instruction",
        recommendationFacts: {
          student_id: studentId,
          session_id: options.sessionId,
          has_permission: options.identity.permissions.length > 0,
        },
      });
      engineRecommendations = execution.state?.recommendations ?? [];
    } catch {
      engineRecommendations = [];
    }
  }

  let pajRecommendations = null;
  if (learning.journey && activeCompetencyKey && options.identity) {
    try {
      pajRecommendations = await evaluateJourneyRecommendations({
        supabase,
        studentId,
        schoolId: learning.journey.journey.school_id ?? undefined,
        organizationId: learning.journey.journey.organization_id ?? undefined,
        activeCompetencyKey,
        competencyProgress: learning.journey.competencyProgress,
        actorUserId: options.identity.effectiveUserId,
      });
    } catch {
      pajRecommendations = null;
    }
  }

  const guidance = activeCompetencyKey ? getCompetencyGuidance(activeCompetencyKey) : null;
  const strategies = [
    ...(guidance?.instructionalStrategies ?? []),
    ...(learning.activeCompetency?.instructionalStrategies ?? []),
  ].filter(Boolean);

  const { data: sectionRows } = await supabase
    .from("student_enrollments")
    .select("course_section_id")
    .eq("student_id", studentId)
    .eq("enrollment_status", "enrolled");

  const sectionIds = (sectionRows ?? []).map((r) => r.course_section_id).filter(Boolean);
  let lessonHistory: JagProfileInstruction["lessonHistory"] = [];

  if (sectionIds.length) {
    const { data: sessions } = await supabase
      .from("instructional_sessions")
      .select("id, scheduled_start, session_status, course_sections(section_code, courses(name))")
      .in("course_section_id", sectionIds)
      .order("scheduled_start", { ascending: false })
      .limit(12);

    lessonHistory = (sessions ?? []).map((s) => {
      const cs = Array.isArray(s.course_sections) ? s.course_sections[0] : s.course_sections;
      const course = cs?.courses;
      const c = Array.isArray(course) ? course[0] : course;
      return {
        sessionId: s.id,
        courseName: (c as { name?: string })?.name ?? "Session",
        sectionCode: (cs as { section_code?: string })?.section_code ?? "",
        scheduledAt: s.scheduled_start,
        status: s.session_status,
      };
    });
  }

  const parentReminders = [
    ...operational.openCommunications.map((c) => ({ subject: c.subject, status: "open" })),
    ...operational.outstandingTasks.map((t) => ({ subject: t.title, status: "task_due" })),
  ];

  return {
    engineRecommendations,
    pajRecommendations,
    strategies: [...new Set(strategies)],
    accommodations: operational.iepAccommodations,
    activeInterventions: operational.activeInterventions,
    lessonHistory,
    parentReminders,
  };
}

async function resolveEvidence(
  supabase: AuthClient,
  studentId: string,
  activeCompetencyKey: string | null,
  sessionId?: string
): Promise<JagProfileEvidence> {
  const [observationsRes, artifacts, assessmentsRes, keeEvidence, competencyEvidence] =
    await Promise.all([
      supabase
        .from("teacher_instructional_notes")
        .select("id, title, body, category, created_at")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(15),
      searchEvidenceLibrary(supabase, { studentId, sessionId }),
      supabase
        .from("session_assessment_records")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(20),
      getStudentEvidenceRecords(supabase, studentId, { limit: 15 }),
      activeCompetencyKey
        ? getStudentEvidenceRecords(supabase, studentId, {
            competencyKey: activeCompetencyKey,
            limit: 12,
          })
        : Promise.resolve([]),
    ]);

  return {
    observations: (observationsRes.data ?? []).map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      category: n.category,
      createdAt: n.created_at,
    })),
    artifacts: artifacts as Record<string, unknown>[],
    assessments: (assessmentsRes.data ?? []) as Record<string, unknown>[],
    keeEvidence,
    competencyEvidence,
  };
}

async function resolveReadinessSection(
  supabase: AuthClient,
  studentId: string,
  operational: Awaited<ReturnType<typeof buildOperationalReadinessSnapshot>>,
  learning: JagProfileLearning,
  identity: JagProfileIdentity
): Promise<JagProfileReadiness> {
  const masteryLevel = learning.activeCompetencyProgress?.mastery_level ?? 0;
  const evidenceCount = learning.competencyHistory.length;
  const graduationScore = Math.min(
    100,
    Math.round(masteryLevel * 20 + learning.masterySummary.proficientCount * 8 + evidenceCount * 2)
  );

  let graduationRuleOutcome: string | undefined;
  let graduationExplanation: string | undefined;
  try {
    const ruleResult = await evaluateRuleSet(
      {
        ruleSetKey: "ref_graduation_readiness",
        facts: { readiness_score: graduationScore },
        entityType: "student",
        entityId: studentId,
        schoolId: identity.campuses.schoolId || undefined,
        metadata: { domain: "graduation_readiness" },
      },
      { persist: { supabase }, recordAudit: true }
    );
    graduationRuleOutcome = ruleResult.primaryOutcome?.outcomeKey;
    graduationExplanation = ruleResult.explanation.summary;
  } catch {
    // Rules evaluation is best-effort
  }

  const transitionScore = Math.min(
    100,
    Math.round(
      graduationScore * 0.5 +
        (operational.recentAttendance.filter((a) => a.status === "present").length /
          Math.max(1, operational.recentAttendance.length)) *
          50
    )
  );

  const successScore = await getLatestStudentSuccessScore(supabase, studentId);
  const riskSignals: string[] = [];
  if (operational.medicalAlerts.length) riskSignals.push(`${operational.medicalAlerts.length} medical alert(s)`);
  if (operational.activeInterventions.length) {
    riskSignals.push(`${operational.activeInterventions.length} active intervention(s)`);
  }
  if (operational.recentBehavior.length) {
    riskSignals.push(`${operational.recentBehavior.length} recent behavior event(s)`);
  }
  if (!learning.prerequisiteStatus.ok) {
    riskSignals.push(`Missing prerequisites: ${learning.prerequisiteStatus.missing.join(", ")}`);
  }
  if (successScore?.statusIndicator === "red") riskSignals.push("SSIS success score in red zone");

  const riskLevel: JagProfileReadiness["riskIndicators"]["level"] =
    successScore?.statusIndicator === "red" || riskSignals.length >= 4
      ? "high"
      : successScore?.statusIndicator === "yellow" || riskSignals.length >= 2
        ? "medium"
        : "low";

  const presentCount = operational.recentAttendance.filter((a) => a.status === "present").length;
  const totalRecent = operational.recentAttendance.length;

  const executiveSummaries = [
    `${identity.displayName} — ${identity.demographics.gradeLevel ?? "Grade N/A"} · ${identity.enrollment.program ?? "Program N/A"}`,
    `Competency: ${learning.activeCompetency?.title ?? "None active"} (L${masteryLevel})`,
    `Graduation readiness: ${graduationScore}%`,
    `Risk level: ${riskLevel}`,
  ];
  if (successScore) {
    executiveSummaries.push(
      `SSIS success score: ${successScore.overallScore} (${successScore.statusIndicator})`
    );
  }

  return {
    operational,
    graduationReadiness: {
      score: graduationScore,
      ready: graduationScore >= 85,
      ruleOutcomeKey: graduationRuleOutcome,
      explanation: graduationExplanation,
    },
    transitionReadiness: {
      score: transitionScore,
      ready: transitionScore >= 70,
      explanation: `Transition signal derived from graduation readiness and attendance patterns (${transitionScore}%).`,
    },
    riskIndicators: {
      level: riskLevel,
      signals: riskSignals,
      successScore: successScore?.overallScore,
      statusIndicator: successScore?.statusIndicator,
    },
    attendanceSummary: {
      presentCount,
      totalRecent,
      ratePercent: totalRecent ? Math.round((presentCount / totalRecent) * 100) : 100,
    },
    executiveSummaries,
  };
}

function resolveAiSection(
  instruction: JagProfileInstruction,
  learning: JagProfileLearning,
  readiness: JagProfileReadiness,
  evidence: JagProfileEvidence
): JagProfileAi {
  const recommendations: JagProfileAiRecommendation[] = [];

  for (const rec of instruction.engineRecommendations) {
    recommendations.push({
      source: "execution_engine",
      title: rec.title,
      rationale: rec.rationale,
      priority: rec.priority,
    });
  }

  if (instruction.pajRecommendations?.learningRecommendation) {
    const lr = instruction.pajRecommendations.learningRecommendation;
    recommendations.push({
      source: "paj",
      title: lr.label,
      rationale: "Personal Learning Journey recommendation",
      confidence: lr.score,
      outcomeKey: lr.outcomeKey,
    });
  }

  if (instruction.pajRecommendations?.interventionRecommendation) {
    const ir = instruction.pajRecommendations.interventionRecommendation;
    recommendations.push({
      source: "paj",
      title: ir.label,
      rationale: "Intervention recommendation from journey analysis",
      confidence: ir.score,
      outcomeKey: ir.outcomeKey,
      priority: "high",
    });
  }

  for (const strategy of instruction.strategies.slice(0, 3)) {
    recommendations.push({
      source: "ulr",
      title: strategy,
      rationale: "ULR instructional strategy for active competency",
    });
  }

  if (readiness.graduationReadiness.ruleOutcomeKey) {
    recommendations.push({
      source: "rules",
      title: readiness.graduationReadiness.ready ? "Graduation on track" : "Graduation review recommended",
      rationale: readiness.graduationReadiness.explanation ?? "Rules engine graduation readiness evaluation",
      outcomeKey: readiness.graduationReadiness.ruleOutcomeKey,
    });
  }

  const explanations = [
    readiness.graduationReadiness.explanation,
    readiness.transitionReadiness.explanation,
    learning.prerequisiteStatus.ok
      ? "Prerequisite chain satisfied for active competency."
      : `Prerequisites pending: ${learning.prerequisiteStatus.missing.join(", ")}`,
  ].filter(Boolean) as string[];

  const supportingEvidence = [
    ...evidence.competencyEvidence.slice(0, 3).map((e) => ({
      label: e.evidence_type_key,
      ref: e.id,
    })),
    ...evidence.artifacts.slice(0, 2).map((a) => ({
      label: String((a as { title?: string }).title ?? "Artifact"),
      ref: String((a as { id?: string }).id ?? ""),
    })),
  ].filter((e) => e.ref);

  const confidence = Math.min(
    100,
    Math.round(
      readiness.graduationReadiness.score * 0.25 +
        (instruction.pajRecommendations ? 25 : 0) +
        (instruction.engineRecommendations.length ? 20 : 0) +
        evidence.competencyEvidence.length * 5 +
        (readiness.riskIndicators.level === "low" ? 15 : 0)
    )
  );

  return {
    recommendations,
    confidence: Math.min(100, confidence),
    explanations,
    supportingEvidence,
  };
}

/** Resolve the canonical JAG Profile for a learner — composes existing platform runtime only. */
export async function resolveJagProfile(
  supabase: AuthClient,
  studentId: string,
  options: ResolveJagProfileOptions = {}
): Promise<JagProfile> {
  const sections = options.sections ?? ALL_SECTIONS;
  const permissions = options.identity?.permissions ?? [];

  const operational = await buildOperationalReadinessSnapshot(supabase, studentId);

  const [identity, learning] = await Promise.all([
    includesSection(sections, "identity")
      ? resolveIdentity(supabase, studentId, permissions)
      : Promise.resolve({
          studentId,
          displayName: "",
          preferredName: null,
          demographics: {
            dateOfBirth: null,
            gradeLevel: null,
            gender: null,
            studentNumber: null,
            photoUrl: null,
          },
          enrollment: {
            status: "unknown",
            program: null,
            lifecycleStage: null,
            graduationYear: null,
            sisEnrollments: [],
            courseSections: [],
          },
          family: { familyId: null, familyName: null, guardians: [] },
          campuses: { schoolId: "", schoolName: null, campusName: null },
          permissions,
        } satisfies JagProfileIdentity),
    includesSection(sections, "learning") || includesSection(sections, "instruction")
      ? resolveLearning(supabase, studentId)
      : Promise.resolve({
          journey: null,
          activeCompetency: null,
          activeCompetencyProgress: null,
          competencyHistory: [],
          masterySummary: { proficientCount: 0, inProgressCount: 0, totalTracked: 0 },
          prerequisiteGraph: [],
          prerequisiteStatus: { ok: true, missing: [] },
        } satisfies JagProfileLearning),
  ]);

  if (!identity.displayName && includesSection(sections, "identity")) {
    // identity already resolved
  } else if (!includesSection(sections, "identity")) {
    const student = await getStudentById(studentId);
    identity.displayName = student
      ? `${student.first_name} ${student.last_name}`.trim()
      : studentId.slice(0, 8);
    identity.campuses.schoolId = student?.school_id ?? "";
  }

  const instruction = includesSection(sections, "instruction") || includesSection(sections, "ai")
    ? await resolveInstruction(supabase, studentId, options, learning, operational)
    : {
        engineRecommendations: [],
        pajRecommendations: null,
        strategies: [],
        accommodations: operational.iepAccommodations,
        activeInterventions: operational.activeInterventions,
        lessonHistory: [],
        parentReminders: [],
      };

  const evidence = includesSection(sections, "evidence") || includesSection(sections, "ai")
    ? await resolveEvidence(
        supabase,
        studentId,
        learning.activeCompetency?.competencyKey ?? null,
        options.sessionId
      )
    : {
        observations: [],
        artifacts: [],
        assessments: [],
        keeEvidence: [],
        competencyEvidence: [],
      };

  const readiness = includesSection(sections, "readiness") || includesSection(sections, "ai")
    ? await resolveReadinessSection(supabase, studentId, operational, learning, identity)
    : {
        operational,
        graduationReadiness: { score: 0, ready: false },
        transitionReadiness: { score: 0, ready: false },
        riskIndicators: { level: "low" as const, signals: [] },
        attendanceSummary: { presentCount: 0, totalRecent: 0, ratePercent: 100 },
        executiveSummaries: [],
      };

  const ai = includesSection(sections, "ai")
    ? resolveAiSection(instruction, learning, readiness, evidence)
    : { recommendations: [], confidence: 0, explanations: [], supportingEvidence: [] };

  return {
    studentId,
    resolvedAt: new Date().toISOString(),
    identity,
    learning,
    instruction,
    evidence,
    readiness,
    ai,
  };
}

/** Batch-resolve JAG Profiles for roster or session contexts. */
export async function resolveJagProfilesForStudents(
  supabase: AuthClient,
  studentIds: string[],
  options: ResolveJagProfileOptions = {}
): Promise<Map<string, JagProfile>> {
  const map = new Map<string, JagProfile>();
  const unique = [...new Set(studentIds.filter(Boolean))];
  await Promise.all(
    unique.map(async (id) => {
      map.set(id, await resolveJagProfile(supabase, id, options));
    })
  );
  return map;
}

/** Extract operational readiness snapshot from a JAG Profile (backward-compatible adapter). */
export function jagProfileToReadinessSnapshot(profile: JagProfile) {
  return profile.readiness.operational;
}
