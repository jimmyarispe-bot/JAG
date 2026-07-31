import { createParentPortalService } from "@academyos";
import { JagErrors, jsonError, jsonOk } from "@/app/api/academyos/_lib";

/** Parent portal — token auth (no Foundation session required). */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  if (!token) return jsonError(JagErrors.validation("token is required."));
  const result = createParentPortalService().resolve(token);
  if ("error" in result) return jsonError(JagErrors.unauthorized());
  return jsonOk(result);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    token?: string;
    action?: string;
    documentId?: string;
    fileName?: string;
    expiresAt?: string | null;
    scheduledAt?: string;
    assessmentSchedulingEnabled?: boolean;
    wizardId?: string;
    section?: string;
    data?: Record<string, string>;
    completeSection?: boolean;
    invoiceId?: string;
    amount?: number;
    method?: "Online" | "Manual" | "AutoPay";
    enabled?: boolean;
    label?: string;
    lastFour?: string;
  };
  if (!body.token) return jsonError(JagErrors.validation("token is required."));
  const token = body.token;
  const portal = createParentPortalService();
  const action = body.action ?? "status";

  if (action === "upload") {
    if (!body.documentId || !body.fileName) {
      return jsonError(
        JagErrors.validation("documentId and fileName are required.")
      );
    }
    const result = portal.uploadDocument({
      token,
      documentId: body.documentId,
      fileName: body.fileName,
      expiresAt: body.expiresAt,
    });
    if (!result) return jsonError(JagErrors.notFound("Document not found."));
    if ("error" in result) return jsonError(JagErrors.validation(result.error));
    return jsonOk({ document: result });
  }

  if (action === "schedule_assessment") {
    const result = portal.scheduleAssessment({
      token,
      scheduledAt: body.scheduledAt ?? new Date().toISOString(),
      enabled: body.assessmentSchedulingEnabled,
    });
    if (!result) return jsonError(JagErrors.notFound("Applicant not found."));
    if ("error" in result) return jsonError(JagErrors.validation(result.error));
    return jsonOk({ applicant: result });
  }

  if (action === "accept_offer") {
    const result = portal.acceptOffer({ token: body.token });
    if ("error" in result) return jsonError(JagErrors.validation(result.error));
    return jsonOk({ wizard: result });
  }

  if (action === "save_enrollment") {
    if (!body.wizardId) {
      return jsonError(JagErrors.validation("wizardId is required."));
    }
    const result = portal.saveEnrollment({
      token,
      wizardId: body.wizardId,
      section: body.section as never,
      data: body.data,
      completeSection: body.completeSection,
    });
    if (!result) return jsonError(JagErrors.notFound("Wizard not found."));
    if ("error" in result) return jsonError(JagErrors.validation(result.error));
    return jsonOk({ wizard: result });
  }

  if (action === "submit_enrollment") {
    if (!body.wizardId) {
      return jsonError(JagErrors.validation("wizardId is required."));
    }
    const result = portal.submitEnrollment({
      token,
      wizardId: body.wizardId,
    });
    if (!result) return jsonError(JagErrors.notFound("Wizard not found."));
    if ("error" in result) return jsonError(JagErrors.validation(result.error));
    return jsonOk({ wizard: result });
  }

  if (action === "pay_invoice") {
    if (!body.invoiceId || body.amount == null) {
      return jsonError(
        JagErrors.validation("invoiceId and amount are required.")
      );
    }
    const result = portal.payInvoice({
      token,
      invoiceId: body.invoiceId,
      amount: body.amount,
      method: body.method,
    });
    if ("error" in result) return jsonError(JagErrors.validation(result.error));
    return jsonOk({ payment: result });
  }

  if (action === "set_autopay") {
    const result = portal.setAutoPay({
      token,
      enabled: Boolean(body.enabled),
    });
    if (!result) return jsonError(JagErrors.notFound("Account not found."));
    if ("error" in result) return jsonError(JagErrors.validation(result.error));
    return jsonOk({ account: result });
  }

  if (action === "add_payment_method") {
    if (!body.label) {
      return jsonError(JagErrors.validation("label is required."));
    }
    const result = portal.addPaymentMethod({
      token,
      label: body.label,
      kind: body.method === "Manual" ? "Manual" : "Online",
      lastFour: body.lastFour,
    });
    if ("error" in result) return jsonError(JagErrors.validation(result.error));
    return jsonOk({ paymentMethod: result });
  }

  if (action === "download_statement") {
    const result = portal.downloadStatement({ token });
    if ("error" in result) {
      return jsonError(JagErrors.validation(result.error ?? "Download failed"));
    }
    return jsonOk(result);
  }

  return jsonError(JagErrors.validation("Unknown action."));
}
