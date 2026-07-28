/**
 * Platform Sprint P-010 — JAG Reconciliation™
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  createFinanceEngine,
  createReconciliationEngine,
  createTreasuryEngine,
  FINANCE_FOUNDATION_GUARDS,
  RECONCILIATION_GUARDS,
  RECONCILIATION_SIGNAL_TYPES,
  resetFinanceStoreForTests,
  TREASURY_GUARDS,
} from "@finance";

const root = join(__dirname, "../../../..");
const docs = join(root, "docs/platform/finance/reconciliation");

afterEach(() => {
  resetFinanceStoreForTests();
});

function setupOrg(orgId: string) {
  const finance = createFinanceEngine();
  finance.bootstrap({ organizationId: orgId, userId: "u-cfo" });
  finance.grantRoles({
    organizationId: orgId,
    userId: "u-recon",
    roles: Object.freeze(["reconcile", "create"]),
    actorUserId: "u-cfo",
  });
  finance.grantRoles({
    organizationId: orgId,
    userId: "u-controller",
    roles: Object.freeze(["controller", "approve", "close_period"]),
    actorUserId: "u-cfo",
  });
  finance.grantRoles({
    organizationId: orgId,
    userId: "u-fm",
    roles: Object.freeze(["approve"]),
    actorUserId: "u-cfo",
  });
  finance.grantRoles({
    organizationId: orgId,
    userId: "u-auditor",
    roles: Object.freeze(["auditor"]),
    actorUserId: "u-cfo",
  });
  const treasury = createTreasuryEngine();
  const bank = treasury.createTreasuryAccount({
    organizationId: orgId,
    userId: "u-cfo",
    name: "Operating",
    kind: "checking",
    currentBalance: 10_000,
    availableBalance: 10_000,
  });
  if ("error" in bank) throw new Error(bank.error);
  return { finance, treasury, bank, recon: createReconciliationEngine() };
}

describe("P-010 JAG Reconciliation", () => {
  it("guards exclude statements, forecasting, AI CFO, EBITDA; twin signals registered", () => {
    expect(RECONCILIATION_GUARDS.includesReconciliation).toBe(true);
    expect(RECONCILIATION_GUARDS.includesFinancialStatements).toBe(false);
    expect(RECONCILIATION_GUARDS.includesForecasting).toBe(false);
    expect(RECONCILIATION_GUARDS.includesAiCfo).toBe(false);
    expect(RECONCILIATION_GUARDS.includesEbitda).toBe(false);
    expect(RECONCILIATION_GUARDS.digitalTwinSignalSource).toBe(true);
    expect(RECONCILIATION_SIGNAL_TYPES).toContain(
      "reconciliation.period_opened"
    );
    expect(TREASURY_GUARDS.includesReconciliation).toBe(false);
    expect(FINANCE_FOUNDATION_GUARDS.includesAiCfo).toBe(false);
  });

  it("auto-matches exact bank↔payment amounts and publishes twin signals", () => {
    const { finance, bank, recon } = setupOrg("org.auto");
    const signals: string[] = [];
    recon.subscribeSignals((e) => signals.push(e.type));

    const vendor = finance.createVendor({
      organizationId: "org.auto",
      userId: "u-cfo",
      name: "Office Co",
    });
    if ("error" in vendor) return;

    const bill = finance.createBill({
      organizationId: "org.auto",
      userId: "u-cfo",
      vendorId: vendor.id,
      amount: 250,
    });
    if ("error" in bill) return;
    finance.approveBill({
      organizationId: "org.auto",
      userId: "u-cfo",
      billId: bill.id,
    });
    finance.payBill({
      organizationId: "org.auto",
      userId: "u-cfo",
      billId: bill.id,
    });

    const treasury = createTreasuryEngine();
    treasury.createTransaction({
      organizationId: "org.auto",
      userId: "u-cfo",
      bankAccountId: bank.id,
      amount: 250,
      direction: "out",
      description: `Bill payment ${bill.id} Office Co`,
      status: "posted",
      externalId: "ext-pay-250",
    });

    const boot = recon.bootstrapPeriod({
      organizationId: "org.auto",
      userId: "u-recon",
      bankAccountId: bank.id,
      periodKey: "2026-07",
      statementBalance: 9750,
      bookBalance: 9750,
    });
    expect("error" in boot && !("period" in boot)).toBe(false);
    if ("error" in boot && !("period" in boot)) return;

    expect(signals).toContain("reconciliation.period_opened");
    expect(boot.auto?.autoAccepted.length).toBeGreaterThanOrEqual(1);
    expect(signals).toContain("reconciliation.auto_matched");
    expect(recon.listMatches("org.auto").some((m) => m.automatic)).toBe(true);
  });

  it("supports manual matching, splits, duplicate exceptions, and adjustments", () => {
    const { bank, recon, finance } = setupOrg("org.manual");
    const treasury = createTreasuryEngine();

    const t1 = treasury.createTransaction({
      organizationId: "org.manual",
      userId: "u-cfo",
      bankAccountId: bank.id,
      amount: 100,
      direction: "out",
      description: "SPLIT VENDOR CHECK 1001",
      status: "posted",
      externalId: "dup-1",
    });
    const t2 = treasury.createTransaction({
      organizationId: "org.manual",
      userId: "u-cfo",
      bankAccountId: bank.id,
      amount: 100,
      direction: "out",
      description: "SPLIT VENDOR CHECK 1001",
      status: "posted",
      externalId: "dup-1",
    });
    if ("error" in t1 || "error" in t2) return;

    const period = recon.openPeriod({
      organizationId: "org.manual",
      userId: "u-recon",
      bankAccountId: bank.id,
      periodKey: "2026-07",
      statementBalance: 9800,
      bookBalance: 9800,
    });
    expect("error" in period).toBe(false);
    if ("error" in period) return;

    const auto = recon.runAutoMatch({
      organizationId: "org.manual",
      userId: "u-recon",
      periodId: period.id,
    });
    expect("error" in auto).toBe(false);
    if ("error" in auto) return;
    expect(
      recon.listExceptions("org.manual", period.id).some((e) => e.kind === "duplicate")
    ).toBe(true);

    const accounts = finance.listAccounts("org.manual");
    const cash = accounts.find((a) => a.number === "1000")!;
    const expense = accounts.find((a) => a.type === "expense")!;
    const draft = finance.createJournal({
      organizationId: "org.manual",
      userId: "u-cfo",
      description: "Office split A",
      lines: [
        { accountId: expense.id, debit: 60 },
        { accountId: cash.id, credit: 60 },
      ],
    });
    expect("error" in draft).toBe(false);
    if ("error" in draft) return;
    finance.approveJournal({
      organizationId: "org.manual",
      userId: "u-cfo",
      journalId: draft.id,
    });
    finance.postJournal({
      organizationId: "org.manual",
      userId: "u-cfo",
      journalId: draft.id,
    });

    const draft2 = finance.createJournal({
      organizationId: "org.manual",
      userId: "u-cfo",
      description: "Office split B",
      lines: [
        { accountId: expense.id, debit: 40 },
        { accountId: cash.id, credit: 40 },
      ],
    });
    if ("error" in draft2) return;
    finance.approveJournal({
      organizationId: "org.manual",
      userId: "u-cfo",
      journalId: draft2.id,
    });
    finance.postJournal({
      organizationId: "org.manual",
      userId: "u-cfo",
      journalId: draft2.id,
    });

    const manual = recon.manualMatch({
      organizationId: "org.manual",
      userId: "u-recon",
      periodId: period.id,
      cardinality: "one_to_many",
      leftIds: [t1.id],
      leftType: "bank_transaction",
      rightIds: [draft.id, draft2.id],
      rightType: "journal_entry",
      amount: 100,
      reasons: ["split", "manual"],
    });
    expect("error" in manual).toBe(false);
    if ("error" in manual) return;
    expect(manual.cardinality).toBe("one_to_many");
    expect(manual.automatic).toBe(false);

    const adj = recon.postAdjustment({
      organizationId: "org.manual",
      userId: "u-recon",
      periodId: period.id,
      kind: "bank_fee",
      amount: -15,
      memo: "Monthly service fee",
      createJournal: false,
    });
    expect("error" in adj).toBe(false);
    expect(
      recon
        .listSignals("org.manual")
        .some((s) => s.type === "reconciliation.adjustment_posted")
    ).toBe(true);

    for (const ex of recon.listExceptions("org.manual", period.id).filter((e) => e.open)) {
      recon.resolveException({
        organizationId: "org.manual",
        userId: "u-recon",
        exceptionId: ex.id,
      });
    }
  });

  it("runs approval workflow, period close, reopen, and audit trail", () => {
    const { bank, recon, finance } = setupOrg("org.close");
    const period = recon.openPeriod({
      organizationId: "org.close",
      userId: "u-recon",
      bankAccountId: bank.id,
      periodKey: "2026-06",
      statementBalance: 10_000,
      bookBalance: 10_000,
    });
    if ("error" in period) return;

    // No exceptions path
    const a1 = recon.approve({
      organizationId: "org.close",
      userId: "u-recon",
      periodId: period.id,
      stage: "reconciler",
    });
    expect("error" in a1).toBe(false);

    const selfCtrl = recon.approve({
      organizationId: "org.close",
      userId: "u-recon",
      periodId: period.id,
      stage: "controller",
    });
    expect("error" in selfCtrl).toBe(true);

    const a2 = recon.approve({
      organizationId: "org.close",
      userId: "u-controller",
      periodId: period.id,
      stage: "controller",
    });
    expect("error" in a2).toBe(false);

    const a3 = recon.approve({
      organizationId: "org.close",
      userId: "u-fm",
      periodId: period.id,
      stage: "finance_manager",
    });
    expect("error" in a3).toBe(false);

    const a4 = recon.approve({
      organizationId: "org.close",
      userId: "u-cfo",
      periodId: period.id,
      stage: "cfo",
    });
    expect("error" in a4).toBe(false);
    if ("error" in a4) return;
    expect(a4.period?.status).toBe("finalized");

    const auditorApprove = recon.approve({
      organizationId: "org.close",
      userId: "u-auditor",
      periodId: period.id,
      stage: "reconciler",
    });
    expect("error" in auditorApprove).toBe(true);

    const closed = recon.close({
      organizationId: "org.close",
      userId: "u-controller",
      periodId: period.id,
    });
    expect("error" in closed).toBe(false);
    if ("error" in closed) return;
    expect(closed.status).toBe("closed");
    expect(
      recon
        .listSignals("org.close")
        .some((s) => s.type === "reconciliation.period_closed")
    ).toBe(true);

    const reopened = recon.reopen({
      organizationId: "org.close",
      userId: "u-cfo",
      periodId: period.id,
    });
    expect("error" in reopened).toBe(false);
    if ("error" in reopened) return;
    expect(reopened.status).toBe("reopened");

    const history = recon.listHistory("org.close", period.id);
    expect(history.some((h) => h.action === "period_opened")).toBe(true);
    expect(history.some((h) => h.action === "approved_cfo")).toBe(true);
    expect(history.some((h) => h.action === "period_closed")).toBe(true);
    expect(finance.listAudit("org.close").length).toBeGreaterThan(0);

    const analytics = recon.analytics("org.close");
    expect(analytics.closedPeriods + analytics.openPeriods).toBeGreaterThan(0);
  });

  it("regresses P-008/P-009 and ships reconciliation docs/APIs/modules", () => {
    const finance = createFinanceEngine();
    const boot = finance.bootstrap({
      organizationId: "org.reg",
      userId: "u-cfo",
    });
    expect("error" in boot).toBe(false);
    expect(finance.reconciliation.guards.includesReconciliation).toBe(true);
    expect(finance.treasury.guards.includesReconciliation).toBe(false);

    const bank = finance.treasury.createTreasuryAccount({
      organizationId: "org.reg",
      userId: "u-cfo",
      name: "Ops",
      kind: "checking",
      currentBalance: 1,
    });
    expect("error" in bank).toBe(false);

    for (const name of [
      "01_ARCHITECTURE.md",
      "02_MATCHING.md",
      "03_WORKFLOWS.md",
      "04_EXCEPTIONS.md",
      "05_SECURITY.md",
      "06_API.md",
    ]) {
      expect(existsSync(join(docs, name))).toBe(true);
    }
    for (const route of [
      "src/app/api/finance/reconciliation/open/route.ts",
      "src/app/api/finance/reconciliation/match/route.ts",
      "src/app/api/finance/reconciliation/exceptions/route.ts",
      "src/app/api/finance/reconciliation/approve/route.ts",
      "src/app/api/finance/reconciliation/close/route.ts",
      "src/app/api/finance/reconciliation/history/route.ts",
    ]) {
      expect(existsSync(join(root, route))).toBe(true);
    }
    for (const m of [
      "matching",
      "rules",
      "exceptions",
      "suggestions",
      "workflows",
      "approvals",
      "periods",
      "history",
      "analytics",
    ]) {
      expect(
        existsSync(
          join(root, `packages/platform/finance/reconciliation/${m}/index.ts`)
        )
      ).toBe(true);
    }
    expect(
      existsSync(
        join(root, "packages/platform/finance/reconciliation/engine/index.ts")
      )
    ).toBe(true);
  });
});
