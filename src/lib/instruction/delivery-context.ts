import { executeWorkspace } from "@/lib/platform/execution-engine";
import type { ExecutableWorkspaceState, RuntimeRecommendation } from "@/lib/platform/execution-engine/types";
import type { PlatformEvidenceRecord } from "@/lib/platform/evidence/types";
import type { IdentityContext } from "@/lib/platform/identity/context";
import { resolveJagProfile } from "@/lib/platform/jag-profile";
import { buildPrerequisiteGraph } from "@/lib/platform/jag-profile/prerequisite";
import type { JagProfilePrerequisiteItem } from "@/lib/platform/jag-profile/types";
import { getCompetencyGuidance } from "@/lib/platform/paj/guidance";
import type { PajCompetencyProgressRecord, PajJourneySnapshot, PajRecommendationSnapshot } from "@/lib/platform/paj/types";
import type { UlrCompetencyDefinition } from "@/lib/platform/ulr/types";
import { getTeacherLessonPlans, getTeacherNotes } from "@/lib/teacher/queries";
import type { StudentReadinessSnapshot } from "@/lib/instruction/readiness";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export type PrerequisiteChainItem = JagProfilePrerequisiteItem;

export interface InstructionDeliveryContext {
  sessionId: string;
  student: { id: string; firstName: string; lastName: string };
  courseName: string;
  sectionCode: string;
  scheduledLabel: string;
  lessonStatus: string;
  lessonObjectives: string[];
  execution: ExecutableWorkspaceState | null;
  jagProfile: Awaited<ReturnType<typeof resolveJagProfile>>;
  learnerProfile: StudentReadinessSnapshot;
  journey: PajJourneySnapshot | null;
  activeCompetency: UlrCompetencyDefinition | null;
  competencyProgress: PajCompetencyProgressRecord | null;
  prerequisiteStatus: {
    ok: boolean;
    missing: string[];
    chain: PrerequisiteChainItem[];
  };
  accommodations: string[];
  engineRecommendations: RuntimeRecommendation[];
  pajRecommendations: PajRecommendationSnapshot | null;
  guidance: ReturnType<typeof getCompetencyGuidance> | null;
  lessonPlans: Awaited<ReturnType<typeof getTeacherLessonPlans>>;
  knowledgeAssets: { nodeKey: string; title: string; kind: string }[];
  platformEvidence: PlatformEvidenceRecord[];
  sessionArtifacts: Awaited<ReturnType<typeof resolveJagProfile>>["evidence"]["artifacts"];
  teacherNotes: Awaited<ReturnType<typeof getTeacherNotes>>;
  parentReminders: { subject: string; status: string }[];
  meetLink: string | null;
}

function parseObjectiveLines(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(String).filter(Boolean);
}

/** Resolve full instructional delivery context via JAG Profile + session runtime — no duplicate aggregation. */
export async function resolveInstructionDeliveryContext(input: {
  supabase: AuthClient;
  sessionId: string;
  studentId: string;
  employeeId: string;
  identity: IdentityContext;
  sessionRow: Record<string, unknown>;
  delivery: Record<string, unknown> | null;
  course: { name?: string } | null;
  sectionCode: string;
  scheduledLabel: string;
}): Promise<InstructionDeliveryContext> {
  const { supabase, sessionId, studentId, employeeId, identity } = input;

  const [jagProfile, executionResult, lessonPlans, teacherNotes] = await Promise.all([
    resolveJagProfile(supabase, studentId, {
      identity,
      employeeId,
      sessionId,
      workspaceKey: "teacher",
      activeView: "instruction",
    }),
    executeWorkspace({
      workspaceKey: "teacher",
      identity,
      activeView: "instruction",
      recommendationFacts: {
        session_id: sessionId,
        student_id: studentId,
        has_permission: identity.permissions.length > 0,
      },
    }),
    getTeacherLessonPlans(supabase, employeeId),
    getTeacherNotes(supabase, employeeId),
  ]);

  const { learning, instruction, evidence, readiness } = jagProfile;
  const activeCompetencyKey = learning.activeCompetency?.competencyKey ?? null;
  const guidance = activeCompetencyKey ? getCompetencyGuidance(activeCompetencyKey) : null;
  const execution = executionResult.state;

  const nameParts = jagProfile.identity.displayName.split(" ");
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.slice(1).join(" ");

  return {
    sessionId,
    student: {
      id: studentId,
      firstName,
      lastName,
    },
    courseName: input.course?.name ?? "Instructional Session",
    sectionCode: input.sectionCode,
    scheduledLabel: input.scheduledLabel,
    lessonStatus: String(input.delivery?.lesson_status ?? "not_started"),
    lessonObjectives: parseObjectiveLines(input.delivery?.lesson_objectives),
    execution,
    jagProfile,
    learnerProfile: readiness.operational,
    journey: learning.journey,
    activeCompetency: learning.activeCompetency,
    competencyProgress: learning.activeCompetencyProgress,
    prerequisiteStatus: {
      ok: learning.prerequisiteStatus.ok,
      missing: learning.prerequisiteStatus.missing,
      chain: learning.prerequisiteGraph,
    },
    accommodations: instruction.accommodations,
    engineRecommendations: instruction.engineRecommendations.length
      ? instruction.engineRecommendations
      : (execution?.recommendations ?? []),
    pajRecommendations: instruction.pajRecommendations,
    guidance,
    lessonPlans,
    knowledgeAssets: (execution?.knowledge ?? []).map((k) => ({
      nodeKey: k.nodeKey,
      title: k.title,
      kind: k.kind,
    })),
    platformEvidence: evidence.competencyEvidence.length
      ? evidence.competencyEvidence
      : evidence.keeEvidence,
    sessionArtifacts: evidence.artifacts,
    teacherNotes: teacherNotes.filter((n) => !n.student_id || n.student_id === studentId),
    parentReminders: instruction.parentReminders,
    meetLink: (input.sessionRow.meet_link as string | null) ?? null,
  };
}

export { buildPrerequisiteGraph };
