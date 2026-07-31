import {
  createDocumentsService,
  DOCUMENT_REQUIREMENT_TYPES,
} from "@academyos";
import type { DocumentRequirementType } from "@academyos/admissions";
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
  const applicantId = searchParams.get("applicantId") ?? undefined;
  const outstanding = searchParams.get("outstanding") === "1";
  const service = createDocumentsService();
  const docs = outstanding
    ? service.outstanding(gate.organizationId, applicantId)
    : service.list(gate.organizationId, applicantId);

  return jsonOk(
    {
      ...paginate(docs, parsePage(searchParams)),
      requirementTypes: DOCUMENT_REQUIREMENT_TYPES,
      requirements: service.listRequirements(gate.organizationId),
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    action?: string;
    program?: string;
    gradeLevel?: string | null;
    types?: string[];
    documentId?: string;
    fileName?: string;
    expiresAt?: string | null;
    status?: string;
    rejectionReason?: string | null;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;

  const service = createDocumentsService();
  const action = body.action ?? "upload";

  if (action === "configure") {
    const result = service.configureRequirements({
      organizationId: gate.organizationId,
      program: body.program ?? "default",
      gradeLevel: body.gradeLevel,
      types: (body.types ?? []) as DocumentRequirementType[],
    });
    if ("error" in result) return jsonError(JagErrors.validation(result.error));
    return jsonOk(
      { requirements: result },
      { correlationId: gate.correlationId, status: 201 }
    );
  }

  if (action === "upload") {
    if (!body.documentId || !body.fileName) {
      return jsonError(
        JagErrors.validation("documentId and fileName are required.")
      );
    }
    const result = service.upload({
      organizationId: gate.organizationId,
      documentId: body.documentId,
      fileName: body.fileName,
      actor: gate.session.userId,
      expiresAt: body.expiresAt,
    });
    if (!result) return jsonError(JagErrors.notFound("Document not found."));
    if ("error" in result) return jsonError(JagErrors.validation(result.error));
    return jsonOk({ document: result }, { correlationId: gate.correlationId });
  }

  if (action === "review") {
    if (!body.documentId || !body.status) {
      return jsonError(
        JagErrors.validation("documentId and status are required.")
      );
    }
    const result = service.review({
      organizationId: gate.organizationId,
      documentId: body.documentId,
      status: body.status as "Reviewed" | "Approved" | "Rejected",
      actor: gate.session.userId,
      rejectionReason: body.rejectionReason,
    });
    if (!result) return jsonError(JagErrors.notFound("Document not found."));
    if ("error" in result) return jsonError(JagErrors.validation(result.error));
    return jsonOk({ document: result }, { correlationId: gate.correlationId });
  }

  return jsonError(JagErrors.validation("Unknown action."));
}

export async function PATCH(request: Request) {
  return POST(request);
}
