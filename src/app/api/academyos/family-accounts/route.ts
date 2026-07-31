import { createFamilyAccountsService } from "@academyos";
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
  const service = createFamilyAccountsService();
  const accountId = searchParams.get("accountId");
  if (accountId) {
    return jsonOk(
      {
        account: service.get(gate.organizationId, accountId),
        snapshot: service.snapshot(gate.organizationId, accountId),
      },
      { correlationId: gate.correlationId }
    );
  }

  const items = service.list(gate.organizationId);
  return jsonOk(
    { ...paginate(items, parsePage(searchParams)) },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    action?: "create" | "payment_method";
    displayName?: string;
    responsibleParties?: {
      name: string;
      email?: string | null;
      sharePercent: number;
    }[];
    studentIds?: string[];
    siblingDiscountStudentId?: string | null;
    familyAccountId?: string;
    kind?: "Manual" | "Online" | "AutoPay" | "Other";
    label?: string;
    lastFour?: string;
    isDefault?: boolean;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;
  const service = createFamilyAccountsService();

  if (body.action === "payment_method") {
    if (!body.familyAccountId || !body.label) {
      return jsonError(
        JagErrors.validation("familyAccountId and label are required.")
      );
    }
    const method = service.addPaymentMethod({
      organizationId: gate.organizationId,
      familyAccountId: body.familyAccountId,
      kind: body.kind ?? "Online",
      label: body.label,
      lastFour: body.lastFour,
      isDefault: body.isDefault,
      createdBy: gate.session.userId,
    });
    if ("error" in method) {
      return jsonError(JagErrors.validation(method.error));
    }
    return jsonOk(
      { paymentMethod: method },
      { correlationId: gate.correlationId, status: 201 }
    );
  }

  if (!body.displayName || !body.responsibleParties?.length) {
    return jsonError(
      JagErrors.validation(
        "displayName and responsibleParties are required."
      )
    );
  }
  const account = service.create({
    organizationId: gate.organizationId,
    displayName: body.displayName,
    responsibleParties: body.responsibleParties.map((p) => ({
      name: p.name,
      email: p.email ?? null,
      sharePercent: p.sharePercent,
    })),
    studentIds: body.studentIds,
    siblingDiscountStudentId: body.siblingDiscountStudentId,
    createdBy: gate.session.userId,
  });
  if ("error" in account) {
    return jsonError(JagErrors.validation(account.error));
  }
  return jsonOk(
    { account },
    { correlationId: gate.correlationId, status: 201 }
  );
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    accountId?: string;
    displayName?: string;
    studentIds?: string[];
    siblingDiscountStudentId?: string | null;
    autoPayEnabled?: boolean;
    tuitionPlanIds?: string[];
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.accountId) {
    return jsonError(JagErrors.validation("accountId is required."));
  }
  const patched = createFamilyAccountsService().patch({
    organizationId: gate.organizationId,
    accountId: body.accountId,
    displayName: body.displayName,
    studentIds: body.studentIds,
    siblingDiscountStudentId: body.siblingDiscountStudentId,
    autoPayEnabled: body.autoPayEnabled,
    tuitionPlanIds: body.tuitionPlanIds,
    actor: gate.session.userId,
  });
  if (!patched) return jsonError(JagErrors.notFound("Account not found."));
  return jsonOk({ account: patched }, { correlationId: gate.correlationId });
}
