import {
  createLearningIntelligenceEngine,
  type MasteryLevel,
  type MasteryScaleConfig,
} from "@learning-intelligence";
import {
  jsonError,
  jsonOk,
  JagErrors,
  requireLearningOrg,
  requireLearningOrgBody,
} from "../_lib";

// Re-export scale types from adapter surface via engine constants usage
export type { MasteryLevel, MasteryScaleConfig };

export async function GET(request: Request) {
  const gate = await requireLearningOrg(request);
  if (!gate.ok) return gate.response;
  const engine = createLearningIntelligenceEngine();
  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view");

  if (view === "scale") {
    return jsonOk(
      { scale: engine.getMasteryScale(gate.organizationId) },
      { correlationId: gate.correlationId }
    );
  }
  if (view === "distribution") {
    return jsonOk(
      { distribution: engine.masteryDistribution(gate.organizationId) },
      { correlationId: gate.correlationId }
    );
  }
  if (view === "summary") {
    return jsonOk(
      { summary: engine.buildOrgProgressSummary(gate.organizationId) },
      { correlationId: gate.correlationId }
    );
  }

  const studentId = searchParams.get("studentId") ?? undefined;
  return jsonOk(
    {
      mastery: engine.listMastery(gate.organizationId, studentId),
      adapter: engine.adapter.soR,
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    action?: "update" | "configure_scale";
    studentId?: string;
    objectiveId?: string;
    level?: MasteryLevel;
    curriculumId?: string | null;
    assessmentId?: string | null;
    scale?: MasteryScaleConfig;
  };
  const gate = await requireLearningOrgBody(body);
  if (!gate.ok) return gate.response;
  const engine = createLearningIntelligenceEngine();
  const userId = gate.session.userId;

  if (body.action === "configure_scale") {
    if (!body.scale) {
      return jsonError(JagErrors.validation("scale required"));
    }
    const scale = engine.configureMasteryScale(
      gate.organizationId,
      body.scale
    );
    return jsonOk({ scale }, { correlationId: gate.correlationId });
  }

  if (!body.studentId || !body.objectiveId || !body.level) {
    return jsonError(
      JagErrors.validation("studentId, objectiveId, and level required")
    );
  }
  const mastery = engine.updateMastery({
    organizationId: gate.organizationId,
    studentId: body.studentId,
    objectiveId: body.objectiveId,
    level: body.level,
    curriculumId: body.curriculumId,
    assessmentId: body.assessmentId,
    actor: userId,
  });
  if ("error" in mastery) {
    return jsonError(JagErrors.validation(mastery.error));
  }
  return jsonOk(
    { mastery },
    { correlationId: gate.correlationId, status: 201 }
  );
}
