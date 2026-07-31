import {
  createPaymentsService,
  type PaymentMethodKind,
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
  const items = createPaymentsService().list(gate.organizationId, {
    familyAccountId: searchParams.get("familyAccountId") ?? undefined,
    invoiceId: searchParams.get("invoiceId") ?? undefined,
  });
  return jsonOk(
    { ...paginate(items, parsePage(searchParams)) },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    action?: "record" | "autopay" | "refund" | "credit";
    familyAccountId?: string;
    invoiceId?: string | null;
    amount?: number;
    method?: PaymentMethodKind;
    reference?: string | null;
    processor?: string | null;
    reason?: string;
    useCredit?: boolean;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;
  const payments = createPaymentsService();

  if (body.action === "autopay") {
    if (!body.familyAccountId || !body.invoiceId) {
      return jsonError(
        JagErrors.validation("familyAccountId and invoiceId are required.")
      );
    }
    const result = payments.autoPay({
      organizationId: gate.organizationId,
      familyAccountId: body.familyAccountId,
      invoiceId: body.invoiceId,
      createdBy: gate.session.userId,
    });
    if ("error" in result) return jsonError(JagErrors.validation(result.error));
    return jsonOk(
      { payment: result },
      { correlationId: gate.correlationId, status: 201 }
    );
  }

  if (body.action === "refund") {
    if (!body.familyAccountId || body.amount == null) {
      return jsonError(
        JagErrors.validation("familyAccountId and amount are required.")
      );
    }
    const result = payments.refund({
      organizationId: gate.organizationId,
      familyAccountId: body.familyAccountId,
      amount: body.amount,
      reference: body.reference,
      invoiceId: body.invoiceId,
      createdBy: gate.session.userId,
    });
    if ("error" in result) return jsonError(JagErrors.validation(result.error));
    return jsonOk(
      { payment: result },
      { correlationId: gate.correlationId, status: 201 }
    );
  }

  if (body.action === "credit") {
    if (!body.familyAccountId || body.amount == null || !body.reason) {
      return jsonError(
        JagErrors.validation(
          "familyAccountId, amount, and reason are required."
        )
      );
    }
    const result = payments.addCredit({
      organizationId: gate.organizationId,
      familyAccountId: body.familyAccountId,
      amount: body.amount,
      reason: body.reason,
      createdBy: gate.session.userId,
    });
    if ("error" in result) return jsonError(JagErrors.validation(result.error));
    return jsonOk(
      { credit: result },
      { correlationId: gate.correlationId, status: 201 }
    );
  }

  if (
    !body.familyAccountId ||
    body.amount == null ||
    !body.method
  ) {
    return jsonError(
      JagErrors.validation(
        "familyAccountId, amount, and method are required."
      )
    );
  }
  const payment = payments.record({
    organizationId: gate.organizationId,
    familyAccountId: body.familyAccountId,
    invoiceId: body.invoiceId,
    amount: body.amount,
    method: body.method,
    reference: body.reference,
    processor: body.processor,
    useCredit: body.useCredit,
    createdBy: gate.session.userId,
  });
  if ("error" in payment) {
    return jsonError(JagErrors.validation(payment.error));
  }
  return jsonOk(
    { payment },
    { correlationId: gate.correlationId, status: 201 }
  );
}
