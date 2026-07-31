import {
  createGradebookService,
  createMasteryService,
  type MasteryLevel,
  type MasteryScaleConfig,
} from "@academyos";
import { paginate, parsePage } from "@academyos/api/pagination";
import {
  JagErrors,
  jsonError,
  jsonOk,
  requireAcademyOsOrg,
  requireAcademyOsOrgBody,
} from "@/app/api/academyos/_lib";

export async function GET(request: Request) {
  const gate = await requireAcademyOsOrg(request);
  if (!gate.ok) return gate.response;

  const { searchParams } = new URL(request.url);
  const service = createMasteryService();

  if (searchParams.get("view") === "scale") {
    return jsonOk(
      { scale: service.getScale(gate.organizationId) },
      { correlationId: gate.correlationId }
    );
  }
  if (searchParams.get("view") === "distribution") {
    return jsonOk(
      { distribution: service.distribution(gate.organizationId) },
      { correlationId: gate.correlationId }
    );
  }
  if (searchParams.get("view") === "gradebook") {
    const studentId = searchParams.get("studentId");
    if (!studentId) {
      return jsonError(JagErrors.validation("studentId is required."));
    }
    const gradebook = createGradebookService().get({
      organizationId: gate.organizationId,
      studentId,
      teacherId: searchParams.get("teacherId"),
    });
    if ("error" in gradebook) {
      return jsonError(JagErrors.notFound(gradebook.error));
    }
    return jsonOk({ gradebook }, { correlationId: gate.correlationId });
  }

  const studentId = searchParams.get("studentId") ?? undefined;
  if (searchParams.get("view") === "history") {
    const items = service.history(gate.organizationId, studentId);
    return jsonOk(
      { ...paginate(items, parsePage(searchParams)) },
      { correlationId: gate.correlationId }
    );
  }

  const items = service.list(gate.organizationId, studentId);
  return jsonOk(
    { ...paginate(items, parsePage(searchParams)) },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    action?: "update" | "configure_scale";
    studentId?: string;
    objectiveId?: string;
    curriculumId?: string | null;
    level?: MasteryLevel;
    domain?: "Reading" | "Writing" | "Math" | "Structured Literacy";
    progressionLevel?: number | null;
    progressionStep?: number | null;
    scale?: MasteryScaleConfig;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;
  const service = createMasteryService();

  if (body.action === "configure_scale") {
    if (!body.scale) {
      return jsonError(JagErrors.validation("scale is required."));
    }
    const scale = service.configureScale(gate.organizationId, body.scale);
    return jsonOk({ scale }, { correlationId: gate.correlationId });
  }

  if (!body.studentId || !body.objectiveId || !body.level) {
    return jsonError(
      JagErrors.validation("studentId, objectiveId, and level are required.")
    );
  }
  const updated = service.update({
    organizationId: gate.organizationId,
    studentId: body.studentId,
    objectiveId: body.objectiveId,
    curriculumId: body.curriculumId,
    level: body.level,
    domain: body.domain,
    progressionLevel: body.progressionLevel,
    progressionStep: body.progressionStep,
    actor: gate.session.userId,
  });
  if ("error" in updated) {
    return jsonError(JagErrors.validation(updated.error));
  }
  return jsonOk(
    { mastery: updated },
    { correlationId: gate.correlationId, status: 201 }
  );
}

export async function PATCH(request: Request) {
  return POST(request);
}
