import { createEnrollmentWizardService } from "@academyos";
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
  const wizardId = searchParams.get("wizardId");
  const applicantId = searchParams.get("applicantId");
  const service = createEnrollmentWizardService();

  if (wizardId) {
    return jsonOk(
      { wizard: service.get(gate.organizationId, wizardId) },
      { correlationId: gate.correlationId }
    );
  }
  if (applicantId) {
    return jsonOk(
      { wizard: service.getByApplicant(gate.organizationId, applicantId) },
      { correlationId: gate.correlationId }
    );
  }
  return jsonError(JagErrors.validation("wizardId or applicantId required."));
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    action?: string;
    applicantId?: string;
    wizardId?: string;
    section?: string;
    data?: Record<string, string>;
    completeSection?: boolean;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;

  const service = createEnrollmentWizardService();
  const action = body.action ?? "start";

  if (action === "start") {
    if (!body.applicantId) {
      return jsonError(JagErrors.validation("applicantId is required."));
    }
    const result = service.start({
      organizationId: gate.organizationId,
      applicantId: body.applicantId,
      actor: gate.session.userId,
    });
    if ("error" in result) return jsonError(JagErrors.validation(result.error));
    return jsonOk(
      { wizard: result },
      { correlationId: gate.correlationId, status: 201 }
    );
  }

  if (action === "save") {
    if (!body.wizardId) {
      return jsonError(JagErrors.validation("wizardId is required."));
    }
    const result = service.save({
      organizationId: gate.organizationId,
      wizardId: body.wizardId,
      actor: gate.session.userId,
      section: body.section as never,
      data: body.data,
      completeSection: body.completeSection,
    });
    if (!result) return jsonError(JagErrors.notFound("Wizard not found."));
    if ("error" in result) return jsonError(JagErrors.validation(result.error));
    return jsonOk({ wizard: result }, { correlationId: gate.correlationId });
  }

  if (action === "submit") {
    if (!body.wizardId) {
      return jsonError(JagErrors.validation("wizardId is required."));
    }
    const result = service.submit({
      organizationId: gate.organizationId,
      wizardId: body.wizardId,
      actor: gate.session.userId,
    });
    if (!result) return jsonError(JagErrors.notFound("Wizard not found."));
    if ("error" in result) return jsonError(JagErrors.validation(result.error));
    return jsonOk({ wizard: result }, { correlationId: gate.correlationId });
  }

  return jsonError(JagErrors.validation("Unknown action."));
}

export async function PATCH(request: Request) {
  return POST(request);
}
