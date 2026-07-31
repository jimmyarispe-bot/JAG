import {
  buildFinancialOperationsSummary,
  createFinanceQuickBooksService,
  createFinanceReportingService,
  createFinanceBillingService,
  type FinanceReportKind,
} from "@academyos";
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
  const report = searchParams.get("report") as FinanceReportKind | null;
  if (report) {
    return jsonOk(
      {
        report: createFinanceReportingService().generate(
          gate.organizationId,
          report
        ),
      },
      { correlationId: gate.correlationId }
    );
  }

  return jsonOk(
    {
      summary: buildFinancialOperationsSummary(gate.organizationId),
      config: createFinanceBillingService().getConfig(gate.organizationId),
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    action?: "configure" | "apply_late_fees" | "quickbooks_sync";
    monthlyDueDay?: number;
    siblingDiscountPercent?: number;
    lateFeeDailyAmount?: number;
    lateFeeMaxDays?: number;
    organizationName?: string;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;

  if (body.action === "configure") {
    const config = createFinanceBillingService().configure(
      gate.organizationId,
      {
        monthlyDueDay: body.monthlyDueDay,
        siblingDiscountPercent: body.siblingDiscountPercent,
        lateFeeDailyAmount: body.lateFeeDailyAmount,
        lateFeeMaxDays: body.lateFeeMaxDays,
      }
    );
    return jsonOk({ config }, { correlationId: gate.correlationId });
  }

  if (body.action === "apply_late_fees") {
    const invoices = createFinanceBillingService().applyLateFees({
      organizationId: gate.organizationId,
      actor: gate.session.userId,
    });
    return jsonOk({ invoices }, { correlationId: gate.correlationId });
  }

  if (body.action === "quickbooks_sync") {
    const result = await createFinanceQuickBooksService().synchronize({
      organizationId: gate.organizationId,
      organizationName: body.organizationName,
      actorUserId: gate.session.userId,
      demo: true,
    });
    if (!result.ok) {
      return jsonError(JagErrors.validation(result.message));
    }
    return jsonOk({ sync: result }, { correlationId: gate.correlationId });
  }

  return jsonError(
    JagErrors.validation(
      "action must be configure, apply_late_fees, or quickbooks_sync."
    )
  );
}
