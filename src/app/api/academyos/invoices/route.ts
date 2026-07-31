import {
  createFinanceBillingService,
  type InvoiceCategory,
  type InvoiceStatus,
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
  const invoiceId = searchParams.get("invoiceId");
  const billing = createFinanceBillingService();
  if (invoiceId) {
    return jsonOk(
      { invoice: billing.get(gate.organizationId, invoiceId) },
      { correlationId: gate.correlationId }
    );
  }

  const items = billing.list(gate.organizationId, {
    familyAccountId: searchParams.get("familyAccountId") ?? undefined,
    studentId: searchParams.get("studentId") ?? undefined,
    status: searchParams.get("status") ?? undefined,
  });
  return jsonOk(
    { ...paginate(items, parsePage(searchParams)) },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    action?: "generate_tuition" | "charge";
    familyAccountId?: string;
    studentId?: string;
    tuitionPlanId?: string;
    periodMonth?: string;
    category?: InvoiceCategory;
    description?: string;
    amount?: number;
    dueOn?: string;
    issue?: boolean;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;
  const billing = createFinanceBillingService();

  if (body.action === "charge") {
    if (
      !body.familyAccountId ||
      !body.category ||
      !body.description ||
      body.amount == null ||
      !body.dueOn
    ) {
      return jsonError(
        JagErrors.validation(
          "familyAccountId, category, description, amount, and dueOn are required."
        )
      );
    }
    const invoice = billing.createCharge({
      organizationId: gate.organizationId,
      familyAccountId: body.familyAccountId,
      studentId: body.studentId,
      category: body.category,
      description: body.description,
      amount: body.amount,
      dueOn: body.dueOn,
      createdBy: gate.session.userId,
      issue: body.issue,
    });
    if ("error" in invoice) {
      return jsonError(JagErrors.validation(invoice.error));
    }
    return jsonOk(
      { invoice },
      { correlationId: gate.correlationId, status: 201 }
    );
  }

  if (
    !body.familyAccountId ||
    !body.studentId ||
    !body.periodMonth
  ) {
    return jsonError(
      JagErrors.validation(
        "familyAccountId, studentId, and periodMonth are required."
      )
    );
  }
  const invoice = billing.generateTuitionInvoice({
    organizationId: gate.organizationId,
    familyAccountId: body.familyAccountId,
    studentId: body.studentId,
    tuitionPlanId: body.tuitionPlanId,
    periodMonth: body.periodMonth,
    category: body.category,
    createdBy: gate.session.userId,
    issue: body.issue,
  });
  if ("error" in invoice) {
    return jsonError(JagErrors.validation(invoice.error));
  }
  return jsonOk(
    { invoice },
    { correlationId: gate.correlationId, status: 201 }
  );
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    invoiceId?: string;
    status?: InvoiceStatus;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.invoiceId || !body.status) {
    return jsonError(
      JagErrors.validation("invoiceId and status are required.")
    );
  }
  const result = createFinanceBillingService().transition({
    organizationId: gate.organizationId,
    invoiceId: body.invoiceId,
    status: body.status,
    actor: gate.session.userId,
  });
  if (!result) return jsonError(JagErrors.notFound("Invoice not found."));
  if ("error" in result) return jsonError(JagErrors.validation(result.error));
  return jsonOk({ invoice: result }, { correlationId: gate.correlationId });
}
