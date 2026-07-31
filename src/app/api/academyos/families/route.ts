import {
  createFamiliesService,
  type FamilyMember,
  type FamilyRelationshipKind,
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
  const items = createFamiliesService().list(
    gate.organizationId,
    searchParams.get("studentId") ?? undefined
  );
  return jsonOk(
    { ...paginate(items, parsePage(searchParams)) },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    studentId?: string;
    kind?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    relationship?: string;
    custodyFlag?: boolean;
    communicationPreference?: FamilyMember["communicationPreference"];
    financialResponsibility?: boolean;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.studentId) {
    return jsonError(JagErrors.validation("studentId is required."));
  }
  const result = createFamiliesService().add({
    organizationId: gate.organizationId,
    studentId: body.studentId,
    kind: (body.kind as FamilyRelationshipKind) ?? "Parent",
    firstName: body.firstName ?? "",
    lastName: body.lastName ?? "",
    email: body.email,
    phone: body.phone,
    relationship: body.relationship ?? body.kind ?? "Parent",
    custodyFlag: body.custodyFlag,
    communicationPreference: body.communicationPreference,
    financialResponsibility: body.financialResponsibility,
    createdBy: gate.session.userId,
  });
  if ("error" in result) return jsonError(JagErrors.validation(result.error));
  return jsonOk(
    { member: result },
    { correlationId: gate.correlationId, status: 201 }
  );
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    memberId?: string;
    custodyFlag?: boolean;
    communicationPreference?: FamilyMember["communicationPreference"];
    financialResponsibility?: boolean;
    email?: string | null;
    phone?: string | null;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.memberId) {
    return jsonError(JagErrors.validation("memberId is required."));
  }
  const result = createFamiliesService().patch({
    organizationId: gate.organizationId,
    memberId: body.memberId,
    actor: gate.session.userId,
    custodyFlag: body.custodyFlag,
    communicationPreference: body.communicationPreference,
    financialResponsibility: body.financialResponsibility,
    email: body.email,
    phone: body.phone,
  });
  if (!result) return jsonError(JagErrors.notFound("Family member not found."));
  return jsonOk({ member: result }, { correlationId: gate.correlationId });
}
