import {
  createFinanceEngine,
  createReconciliationEngine,
  type MatchCardinality,
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
  const { searchParams } = new URL(request.url);
  const periodId = searchParams.get("periodId") ?? undefined;
  const engine = createReconciliationEngine();
  return jsonOk(
    {
      matches: engine.listMatches(gate.organizationId, periodId),
      suggestions: engine.listSuggestions(gate.organizationId, periodId),
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    action?: "auto" | "manual" | "accept_suggestion" | "refresh";
    periodId?: string;
    suggestionId?: string;
    cardinality?: MatchCardinality;
    leftIds?: string[];
    rightIds?: string[];
    leftType?: "bank_transaction" | "statement_line" | "journal_entry" | "invoice" | "bill" | "payment" | "transfer" | "adjustment";
    rightType?: "bank_transaction" | "statement_line" | "journal_entry" | "invoice" | "bill" | "payment" | "transfer" | "adjustment";
  };
  const gate = await requireFinanceOrgBody(body);
  if (!gate.ok) return gate.response;
  const userId = gate.session.userId;
  createFinanceEngine().grantRoles({
    organizationId: gate.organizationId,
    userId,
    roles: Object.freeze(["reconcile", "controller"]),
    actorUserId: userId,
  });
  const engine = createReconciliationEngine();
  const periodId = body.periodId ?? "";

  if (body.action === "auto") {
    const result = engine.runAutoMatch({
      organizationId: gate.organizationId,
      userId,
      periodId,
    });
    if ("error" in result) return jsonError(JagErrors.validation(result.error));
    return jsonOk(result, { correlationId: gate.correlationId });
  }
  if (body.action === "refresh") {
    const result = engine.refreshSuggestions({
      organizationId: gate.organizationId,
      periodId,
    });
    if ("error" in result) return jsonError(JagErrors.validation(result.error));
    return jsonOk(result, { correlationId: gate.correlationId });
  }
  if (body.action === "accept_suggestion") {
    const match = engine.acceptSuggestion({
      organizationId: gate.organizationId,
      userId,
      periodId,
      suggestionId: body.suggestionId ?? "",
    });
    if ("error" in match) return jsonError(JagErrors.validation(match.error));
    return jsonOk(
      { match },
      { correlationId: gate.correlationId, status: 201 }
    );
  }

  const match = engine.manualMatch({
    organizationId: gate.organizationId,
    userId,
    periodId,
    cardinality: body.cardinality ?? "manual",
    leftIds: body.leftIds ?? [],
    leftType: body.leftType ?? "bank_transaction",
    rightIds: body.rightIds ?? [],
    rightType: body.rightType ?? "journal_entry",
  });
  if ("error" in match) return jsonError(JagErrors.validation(match.error));
  return jsonOk(
    { match },
    { correlationId: gate.correlationId, status: 201 }
  );
}
