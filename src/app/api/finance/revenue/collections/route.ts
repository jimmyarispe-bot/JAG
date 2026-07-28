import {
  createFinanceEngine,
  createRevenueEngine,
  type CollectionStatus,
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
  const engine = createRevenueEngine();
  return jsonOk(
    {
      activities: engine.listCollections(gate.organizationId),
      aging: engine.collectionsAging(gate.organizationId),
      plans: engine.listPaymentPlans(gate.organizationId),
      reminders: engine.listReminderRules(gate.organizationId),
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    action?: "activity" | "plan" | "reminder" | "dunning";
    customerId?: string;
    status?: CollectionStatus;
    note?: string;
    invoiceId?: string;
    invoiceIds?: string[];
    installments?: { dueAt: string; amount: number }[];
    daysPastDue?: number;
    channel?: "email" | "portal" | "letter";
  };
  const gate = await requireFinanceOrgBody(body);
  if (!gate.ok) return gate.response;
  const userId = gate.session.userId;
  createFinanceEngine().grantRoles({
    organizationId: gate.organizationId,
    userId,
    roles: Object.freeze(["create", "controller"]),
    actorUserId: userId,
  });
  const engine = createRevenueEngine();

  if (body.action === "plan") {
    const plan = engine.createPaymentPlan({
      organizationId: gate.organizationId,
      userId,
      customerId: body.customerId ?? "",
      invoiceIds: body.invoiceIds ?? [],
      installments: body.installments ?? [],
    });
    if ("error" in plan) return jsonError(JagErrors.validation(plan.error));
    return jsonOk(
      { plan },
      { correlationId: gate.correlationId, status: 201 }
    );
  }
  if (body.action === "reminder") {
    const rule = engine.upsertReminderRule({
      organizationId: gate.organizationId,
      userId,
      daysPastDue: body.daysPastDue ?? 15,
      channel: body.channel ?? "email",
    });
    if ("error" in rule) return jsonError(JagErrors.validation(rule.error));
    return jsonOk(
      { rule },
      { correlationId: gate.correlationId, status: 201 }
    );
  }
  if (body.action === "dunning") {
    const activities = engine.runDunning({
      organizationId: gate.organizationId,
      userId,
    });
    return jsonOk({ activities }, { correlationId: gate.correlationId });
  }

  const activity = engine.recordCollection({
    organizationId: gate.organizationId,
    userId,
    customerId: body.customerId ?? "",
    status: body.status ?? "reminder",
    note: body.note ?? "Collection activity",
    invoiceId: body.invoiceId,
  });
  if ("error" in activity) {
    return jsonError(JagErrors.validation(activity.error));
  }
  return jsonOk(
    { activity },
    { correlationId: gate.correlationId, status: 201 }
  );
}
