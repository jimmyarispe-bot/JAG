import { createFinanceEngine, type JournalEntry } from "@finance";
import {
  jsonError,
  jsonOk,
  JagErrors,
  requireFinanceOrg,
  requireFinanceOrgBody,
} from "../_lib";

export async function GET(request: Request) {
  const gate = await requireFinanceOrg(request);
  if (!gate.ok) return gate.response;
  const engine = createFinanceEngine();
  return jsonOk(
    {
      journals: engine.listJournals(gate.organizationId),
      trialBalance: engine.trialBalanceHint(gate.organizationId),
      dashboard: engine.dashboard(gate.organizationId),
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    action?: "create" | "approve" | "post" | "reverse" | "lock_period";
    journalId?: string;
    periodKey?: string;
    description?: string;
    entityId?: string;
    kind?: JournalEntry["kind"];
    lines?: {
      accountId: string;
      debit?: number;
      credit?: number;
      memo?: string;
    }[];
  };
  const gate = await requireFinanceOrgBody(body);
  if (!gate.ok) return gate.response;
  const engine = createFinanceEngine();
  const userId = gate.session.userId;
  engine.grantRoles({
    organizationId: gate.organizationId,
    userId,
    roles: Object.freeze(["controller", "cfo"]),
    actorUserId: userId,
  });

  if (body.action === "lock_period") {
    const period = engine.lockPeriod({
      organizationId: gate.organizationId,
      userId,
      periodKey: body.periodKey ?? "",
    });
    if ("error" in period) {
      return jsonError(JagErrors.validation(period.error));
    }
    return jsonOk(
      { period },
      { correlationId: gate.correlationId, status: 201 }
    );
  }
  if (body.action === "approve") {
    const journal = engine.approveJournal({
      organizationId: gate.organizationId,
      userId,
      journalId: body.journalId ?? "",
    });
    if ("error" in journal) {
      return jsonError(JagErrors.validation(journal.error));
    }
    return jsonOk(
      { journal },
      { correlationId: gate.correlationId, status: 201 }
    );
  }
  if (body.action === "post") {
    const journal = engine.postJournal({
      organizationId: gate.organizationId,
      userId,
      journalId: body.journalId ?? "",
    });
    if ("error" in journal) {
      return jsonError(JagErrors.validation(journal.error));
    }
    return jsonOk(
      { journal },
      { correlationId: gate.correlationId, status: 201 }
    );
  }
  if (body.action === "reverse") {
    const journal = engine.reverseJournal({
      organizationId: gate.organizationId,
      userId,
      journalId: body.journalId ?? "",
    });
    if ("error" in journal) {
      return jsonError(JagErrors.validation(journal.error));
    }
    return jsonOk(
      { journal },
      { correlationId: gate.correlationId, status: 201 }
    );
  }

  const journal = engine.createJournal({
    organizationId: gate.organizationId,
    userId,
    description: body.description ?? "Journal entry",
    entityId: body.entityId,
    kind: body.kind,
    periodKey: body.periodKey,
    lines: body.lines ?? [],
  });
  if ("error" in journal) {
    return jsonError(JagErrors.validation(journal.error));
  }
  return jsonOk(
    { journal },
    { correlationId: gate.correlationId, status: 201 }
  );
}
