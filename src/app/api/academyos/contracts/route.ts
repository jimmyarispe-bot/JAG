import { createContractService } from "@academyos";
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
  const items = createContractService().list(
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
      | "W-2 Salaried"
      | "W-2 Hourly"
      | "1099 Contractor"
      | "Annual Contract"
      | "Temporary Agreement";
    startsOn?: string;
    endsOn?: string | null;
    renewalDate?: string | null;
    compensationAmount?: number;
    compensationUnit?: "annual" | "hourly" | "per_session" | "flat";
    benefitsEligible?: boolean;
    documentUrls?: string[];
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;
  if (
    !body.employeeId ||
    !body.kind ||
    !body.startsOn ||
    body.compensationAmount == null
  ) {
    return jsonError(
      JagErrors.validation(
        "employeeId, kind, startsOn, and compensationAmount are required."
      )
    );
  }
  const created = createContractService().create({
    organizationId: gate.organizationId,
    employeeId: body.employeeId,
    kind: body.kind,
    startsOn: body.startsOn,
    endsOn: body.endsOn,
    renewalDate: body.renewalDate,
    compensationAmount: body.compensationAmount,
    compensationUnit: body.compensationUnit,
    benefitsEligible: body.benefitsEligible,
    documentUrls: body.documentUrls,
    createdBy: gate.session.userId,
  });
  if ("error" in created) return jsonError(JagErrors.validation(created.error));
  return jsonOk(
    { contract: created },
    { correlationId: gate.correlationId, status: 201 }
  );
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    contractId?: string;
    status?: "Draft" | "Active" | "Expired" | "Terminated";
    endsOn?: string | null;
    renewalDate?: string | null;
    compensationAmount?: number;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.contractId) {
    return jsonError(JagErrors.validation("contractId is required."));
  }
  const patched = createContractService().patch({
    organizationId: gate.organizationId,
    contractId: body.contractId,
    status: body.status,
    endsOn: body.endsOn,
    renewalDate: body.renewalDate,
    compensationAmount: body.compensationAmount,
    actor: gate.session.userId,
  });
  if (!patched) return jsonError(JagErrors.notFound("Contract not found."));
  return jsonOk({ contract: patched }, { correlationId: gate.correlationId });
}
