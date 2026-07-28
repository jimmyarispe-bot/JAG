import {
  createFinanceEngine,
  createPayablesEngine,
  type PaymentMethod,
} from "@finance";
import {
  jsonError,
  jsonOk,
  JagErrors,
  requireFinanceOrg,
  requireFinanceOrgBody,
} from "../../_lib";

export async function GET(request: Request) {
  const gate = await requireFinanceOrg(request);
  if (!gate.ok) return gate.response;
  const engine = createPayablesEngine();
  return jsonOk(
    {
      schedules: engine.listPaymentSchedules(gate.organizationId),
      runs: engine.listPaymentRuns(gate.organizationId),
      payments: engine.listPayments(gate.organizationId),
      twin: engine.listTwin(gate.organizationId, 20),
      evidence: engine.listEvidence(gate.organizationId, 20),
      memory: engine.listMemory(gate.organizationId, 20),
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    action?: "schedule" | "run" | "pay_bill";
    billId?: string;
    scheduledAt?: string;
    method?: PaymentMethod;
    amount?: number;
    earlyDiscountAmount?: number;
    scheduleIds?: string[];
  };
  const gate = await requireFinanceOrgBody(body);
  if (!gate.ok) return gate.response;
  const userId = gate.session.userId;
  createFinanceEngine().grantRoles({
    organizationId: gate.organizationId,
    userId,
    roles: Object.freeze(["create", "post", "controller"]),
    actorUserId: userId,
  });
  const engine = createPayablesEngine();

  if (body.action === "schedule") {
    const schedule = engine.schedulePayment({
      organizationId: gate.organizationId,
      userId,
      billId: body.billId ?? "",
      scheduledAt: body.scheduledAt ?? new Date().toISOString(),
      method: body.method ?? "ach",
      amount: body.amount,
      earlyDiscountAmount: body.earlyDiscountAmount,
    });
    if ("error" in schedule) {
      return jsonError(JagErrors.validation(schedule.error));
    }
    return jsonOk(
      { schedule },
      { correlationId: gate.correlationId, status: 201 }
    );
  }
  if (body.action === "run") {
    const run = engine.executePaymentRun({
      organizationId: gate.organizationId,
      userId,
      scheduleIds: body.scheduleIds ?? [],
      method: body.method ?? "ach",
    });
    if ("error" in run) return jsonError(JagErrors.validation(run.error));
    return jsonOk(
      { run },
      { correlationId: gate.correlationId, status: 201 }
    );
  }

  const payment = engine.payBill({
    organizationId: gate.organizationId,
    userId,
    billId: body.billId ?? "",
  });
  if ("error" in payment) {
    return jsonError(JagErrors.validation(payment.error));
  }
  return jsonOk(
    { payment },
    { correlationId: gate.correlationId, status: 201 }
  );
}
