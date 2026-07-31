import { createCertificationService } from "@academyos";
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
  const service = createCertificationService();
  if (searchParams.get("view") === "expiring") {
    const items = service.expiringSoon(gate.organizationId);
    return jsonOk(
      { ...paginate(items, parsePage(searchParams)) },
      { correlationId: gate.correlationId }
    );
  }
  const items = service.list(
    gate.organizationId,
    searchParams.get("employeeId") ?? undefined
  );
  return jsonOk(
    { ...paginate(items, parsePage(searchParams)) },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    employeeId?: string;
    kind?:
      | "Teaching License"
      | "Structured Literacy Credential"
      | "CPR/First Aid"
      | "Background Check"
      | "Annual Training"
      | "Other";
    name?: string;
    issuedOn?: string | null;
    expiresOn?: string | null;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.employeeId || !body.kind || !body.name) {
    return jsonError(
      JagErrors.validation("employeeId, kind, and name are required.")
    );
  }
  const created = createCertificationService().create({
    organizationId: gate.organizationId,
    employeeId: body.employeeId,
    kind: body.kind,
    name: body.name,
    issuedOn: body.issuedOn,
    expiresOn: body.expiresOn,
    createdBy: gate.session.userId,
  });
  if ("error" in created) return jsonError(JagErrors.validation(created.error));
  return jsonOk(
    { certification: created },
    { correlationId: gate.correlationId, status: 201 }
  );
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    certificationId?: string;
    expiresOn?: string;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.certificationId || !body.expiresOn) {
    return jsonError(
      JagErrors.validation("certificationId and expiresOn are required.")
    );
  }
  const renewed = createCertificationService().renew({
    organizationId: gate.organizationId,
    certificationId: body.certificationId,
    expiresOn: body.expiresOn,
    actor: gate.session.userId,
  });
  if (!renewed) {
    return jsonError(JagErrors.notFound("Certification not found."));
  }
  return jsonOk(
    { certification: renewed },
    { correlationId: gate.correlationId }
  );
}
