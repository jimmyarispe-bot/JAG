import {
  createApprovalService,
  type ApprovalDecision,
  type ApprovalRole,
  type StudioProductId,
} from "@studio";
import {
  JagErrors,
  jsonError,
  jsonOk,
  requireStudioOrg,
  requireStudioOrgBody,
} from "../_lib";

export async function GET(request: Request) {
  const gate = await requireStudioOrg(request);
  if (!gate.ok) return gate.response;
  const { searchParams } = new URL(request.url);
  const service = createApprovalService();
  const productId = searchParams.get("productId") ?? undefined;
  const releaseId = searchParams.get("releaseId") ?? undefined;
  if (searchParams.get("workflow") === "1" && productId) {
    return jsonOk(
      {
        workflow: service.workflow({ productId, releaseId }),
      },
      { correlationId: gate.correlationId }
    );
  }
  return jsonOk(
    {
      approvals: service.list({ productId, releaseId }),
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    productId?: StudioProductId;
    releaseId?: string;
    role?: ApprovalRole;
    decision?: ApprovalDecision;
    comments?: string;
  };
  const gate = await requireStudioOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.productId || !body.role || !body.decision) {
    return jsonError(
      JagErrors.validation("productId, role, and decision are required.")
    );
  }
  const recorded = createApprovalService().record({
    productId: body.productId,
    releaseId: body.releaseId,
    role: body.role,
    approver: gate.session.userId,
    decision: body.decision,
    comments: body.comments,
  });
  if ("error" in recorded) {
    return jsonError(JagErrors.validation(recorded.error));
  }
  return jsonOk(
    {
      approval: recorded,
      workflow: createApprovalService().workflow({
        productId: body.productId,
        releaseId: body.releaseId,
      }),
    },
    { correlationId: gate.correlationId, status: 201 }
  );
}
