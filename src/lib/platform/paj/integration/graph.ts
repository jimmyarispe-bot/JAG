import { buildGraphNodeId } from "@/lib/platform/intelligence-graph/utils";
import { recordGraphEdge } from "@/lib/platform/intelligence-graph/persistence/records";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export async function syncPajJourneyGraph(
  supabase: AuthClient,
  input: {
    journeyId: string;
    studentId: string;
    domainKey: string;
    activeCompetencyKey: string;
    schoolId?: string;
    organizationId?: string;
  }
): Promise<void> {
  const studentNodeId = buildGraphNodeId("entity", "student", input.studentId);
  const journeyNodeId = buildGraphNodeId("learning_journey", "learning_journey", input.journeyId);
  const competencyNodeId = buildGraphNodeId(
    "competency",
    "competency",
    input.activeCompetencyKey
  );
  const domainNodeId = buildGraphNodeId("domain", "learning_domain", input.domainKey);

  await recordGraphEdge(supabase, {
    edgeType: "student.enrolled_in.journey",
    sourceNodeId: studentNodeId,
    targetNodeId: journeyNodeId,
    providerKey: "persisted",
    schoolId: input.schoolId,
    organizationId: input.organizationId,
  });

  await recordGraphEdge(supabase, {
    edgeType: "learning_journey.enrolled_in.domain",
    sourceNodeId: journeyNodeId,
    targetNodeId: domainNodeId,
    providerKey: "persisted",
    schoolId: input.schoolId,
    organizationId: input.organizationId,
  });

  await recordGraphEdge(supabase, {
    edgeType: "learning_journey.contains.competency",
    sourceNodeId: journeyNodeId,
    targetNodeId: competencyNodeId,
    providerKey: "persisted",
    schoolId: input.schoolId,
    organizationId: input.organizationId,
    metadata: { active: true },
  });
}

export async function syncPajMasteryGraphEdge(
  supabase: AuthClient,
  input: {
    studentId: string;
    competencyKey: string;
    masteryLevel: number;
    schoolId?: string;
    organizationId?: string;
  }
): Promise<void> {
  const studentNodeId = buildGraphNodeId("entity", "student", input.studentId);
  const competencyNodeId = buildGraphNodeId("competency", "competency", input.competencyKey);

  await recordGraphEdge(supabase, {
    edgeType: "student.demonstrates.competency",
    sourceNodeId: studentNodeId,
    targetNodeId: competencyNodeId,
    providerKey: "evidence",
    schoolId: input.schoolId,
    organizationId: input.organizationId,
    metadata: { masteryLevel: input.masteryLevel },
  });
}
