import { createLearningIntelligenceEngine } from "@learning-intelligence";
import type { AssessmentKind, MasteryLevel } from "@academyos";
import {
  jsonError,
  jsonOk,
  JagErrors,
  requireLearningOrg,
  requireLearningOrgBody,
} from "../_lib";

export async function GET(request: Request) {
  const gate = await requireLearningOrg(request);
  if (!gate.ok) return gate.response;
  const engine = createLearningIntelligenceEngine();
  const { searchParams } = new URL(request.url);
  return jsonOk(
    {
      assessments: engine.listAssessments(gate.organizationId, {
        studentId: searchParams.get("studentId") ?? undefined,
        kind: (searchParams.get("kind") as AssessmentKind | null) ?? undefined,
      }),
      adapter: engine.adapter.soR,
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    studentId?: string;
    kind?: AssessmentKind;
    assessedOn?: string;
    result?: MasteryLevel | string;
    objectiveId?: string | null;
    curriculumId?: string | null;
    notes?: string;
    evidenceUrls?: string[];
    updateMastery?: boolean;
    linkEvidenceToKnowledge?: boolean;
  };
  const gate = await requireLearningOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.studentId || !body.kind || !body.assessedOn || body.result == null) {
    return jsonError(
      JagErrors.validation("studentId, kind, assessedOn, and result required")
    );
  }
  const engine = createLearningIntelligenceEngine();
  const assessment = engine.recordAssessment({
    organizationId: gate.organizationId,
    studentId: body.studentId,
    kind: body.kind,
    assessedOn: body.assessedOn,
    result: body.result,
    objectiveId: body.objectiveId,
    curriculumId: body.curriculumId,
    notes: body.notes,
    evidenceUrls: body.evidenceUrls,
    updateMastery: body.updateMastery,
    linkEvidenceToKnowledge: body.linkEvidenceToKnowledge,
    createdBy: gate.session.userId,
  });
  if ("error" in assessment) {
    return jsonError(JagErrors.validation(assessment.error));
  }
  return jsonOk(
    { assessment },
    { correlationId: gate.correlationId, status: 201 }
  );
}
