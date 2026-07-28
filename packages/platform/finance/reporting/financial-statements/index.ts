import { newId, nowIso } from "../../ids";
import { listJournals, getAccount } from "../../store";
import { publishOperationalFinanceEvent } from "../../operations/events";
import type {
  FinancialStatement,
  ReportScope,
  StatementKind,
  StatementLine,
} from "../types";
import { upsertStatement } from "../store";
import { computeAccountBalances } from "./balances";

function linesFromBalances(
  balances: ReturnType<typeof computeAccountBalances>,
  sectionFor: (type: string) => string
): StatementLine[] {
  return balances
    .filter((b) => b.debit !== 0 || b.credit !== 0 || b.balance !== 0)
    .map((b) =>
      Object.freeze({
        accountId: b.account.id,
        accountNumber: b.account.number,
        label: `${b.account.number} ${b.account.name}`,
        amount: b.balance,
        section: sectionFor(b.account.type),
        sourceRefs: b.sourceRefs,
      })
    );
}

function sumSection(lines: readonly StatementLine[], section: string): number {
  return lines
    .filter((l) => l.section === section)
    .reduce((s, l) => s + l.amount, 0);
}

function resolveScope(scope: ReportScope, consolidated: boolean): {
  consolidated: boolean;
  scope: ReportScope;
} {
  if (scope === "consolidated" || consolidated) {
    return { consolidated: true, scope: "consolidated" };
  }
  return { consolidated: false, scope };
}

export function generateStatement(input: {
  organizationId: string;
  userId: string;
  kind: StatementKind;
  periodKey: string;
  comparePeriodKey?: string | null;
  scope?: ReportScope;
  scopeId?: string | null;
  dimensionFilters?: Readonly<Record<string, string>>;
  comparative?: boolean;
}): FinancialStatement {
  const scope = input.scope ?? "entity";
  const { consolidated, scope: resolvedScope } = resolveScope(
    scope,
    scope === "consolidated"
  );
  const entityId =
    resolvedScope === "entity" || resolvedScope === "consolidated"
      ? (input.scopeId ?? null)
      : null;
  const filters = input.dimensionFilters ?? {};
  const comparative = Boolean(input.comparative || input.comparePeriodKey);

  let lines: StatementLine[] = [];
  const totals: Record<string, number> = {};

  if (input.kind === "trial_balance") {
    const balances = computeAccountBalances({
      organizationId: input.organizationId,
      periodKey: input.periodKey,
      entityId,
      consolidated,
      dimensionFilters: filters,
    });
    lines = balances.map((b) =>
      Object.freeze({
        accountId: b.account.id,
        accountNumber: b.account.number,
        label: `${b.account.number} ${b.account.name}`,
        amount: b.debit - b.credit,
        section: "trial_balance",
        sourceRefs: b.sourceRefs,
      })
    );
    totals.totalDebits = balances.reduce((s, b) => s + b.debit, 0);
    totals.totalCredits = balances.reduce((s, b) => s + b.credit, 0);
  } else if (input.kind === "balance_sheet") {
    const balances = computeAccountBalances({
      organizationId: input.organizationId,
      periodKey: input.periodKey,
      entityId,
      consolidated,
      dimensionFilters: filters,
      accountTypes: [
        "asset",
        "contra_asset",
        "liability",
        "contra_liability",
        "equity",
        "contra_equity",
      ],
    });
    lines = linesFromBalances(balances, (t) => {
      if (t.includes("asset")) return "assets";
      if (t.includes("liability")) return "liabilities";
      return "equity";
    });
    totals.assets = sumSection(lines, "assets");
    totals.liabilities = sumSection(lines, "liabilities");
    totals.equity = sumSection(lines, "equity");
    totals.liabilitiesAndEquity = totals.liabilities + totals.equity;
  } else if (input.kind === "income_statement") {
    const balances = computeAccountBalances({
      organizationId: input.organizationId,
      periodKey: input.periodKey,
      entityId,
      consolidated,
      dimensionFilters: filters,
      accountTypes: ["revenue", "expense"],
    });
    lines = linesFromBalances(balances, (t) =>
      t === "revenue" ? "revenue" : "expenses"
    );
    totals.revenue = sumSection(lines, "revenue");
    totals.expenses = sumSection(lines, "expenses");
    totals.netIncome = totals.revenue - totals.expenses;
  } else if (input.kind === "cash_flow") {
    const balances = computeAccountBalances({
      organizationId: input.organizationId,
      periodKey: input.periodKey,
      entityId,
      consolidated,
      dimensionFilters: filters,
      accountTypes: ["asset"],
    }).filter(
      (b) =>
        /cash|bank|checking|savings/i.test(b.account.name) ||
        /cash|bank/i.test(b.account.number)
    );
    lines = linesFromBalances(balances, () => "operating");
    totals.netCashChange = lines.reduce((s, l) => s + l.amount, 0);
  } else if (input.kind === "equity_changes") {
    const balances = computeAccountBalances({
      organizationId: input.organizationId,
      periodKey: input.periodKey,
      entityId,
      consolidated,
      dimensionFilters: filters,
      accountTypes: ["equity", "contra_equity"],
    });
    lines = linesFromBalances(balances, () => "equity");
    totals.endingEquity = sumSection(lines, "equity");
  } else if (input.kind === "general_ledger" || input.kind === "account_activity") {
    const journals = listJournals(input.organizationId).filter(
      (j) =>
        j.status === "posted" &&
        j.periodKey === input.periodKey &&
        (consolidated || !entityId || j.entityId === entityId)
    );
    lines = journals.flatMap((j) =>
      j.lines.map((line) => {
        const acct = getAccount(line.accountId);
        return Object.freeze({
          accountId: line.accountId,
          accountNumber: acct?.number ?? null,
          label: `${j.description} · ${acct?.name ?? line.accountId}`,
          amount: line.debit - line.credit,
          section: input.kind,
          sourceRefs: Object.freeze([
            { recordType: "journal", recordId: j.id },
          ]),
        });
      })
    );
    totals.activityCount = lines.length;
  }

  if (comparative && input.comparePeriodKey) {
    const prior = computeAccountBalances({
      organizationId: input.organizationId,
      periodKey: input.comparePeriodKey,
      entityId,
      consolidated,
      dimensionFilters: filters,
    });
    totals.compareTotal = prior.reduce((s, b) => s + b.balance, 0);
  }

  const statement = upsertStatement({
    id: newId("stmt"),
    organizationId: input.organizationId,
    kind: input.kind,
    periodKey: input.periodKey,
    comparePeriodKey: input.comparePeriodKey ?? null,
    scope: resolvedScope,
    scopeId: input.scopeId ?? null,
    dimensionFilters: Object.freeze({ ...filters }),
    lines: Object.freeze(lines),
    totals: Object.freeze(totals),
    generatedAt: nowIso(),
    generatedBy: input.userId,
    comparative,
  });

  publishOperationalFinanceEvent({
    type: "finance.report_generated",
    organizationId: input.organizationId,
    recordType: "financial_statement",
    recordId: statement.id,
    actorUserId: input.userId,
    payload: {
      kind: statement.kind,
      periodKey: statement.periodKey,
      scope: statement.scope,
      totals: statement.totals,
    },
  });

  return statement;
}

export function trialBalance(input: {
  organizationId: string;
  userId: string;
  periodKey: string;
  scope?: ReportScope;
  scopeId?: string | null;
  dimensionFilters?: Readonly<Record<string, string>>;
}): FinancialStatement {
  return generateStatement({ ...input, kind: "trial_balance" });
}

export { computeAccountBalances };
