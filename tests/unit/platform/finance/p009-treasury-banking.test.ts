/**
 * Platform Sprint P-009 — JAG Treasury™ & Banking
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  createFinanceEngine,
  createTreasuryEngine,
  FINANCE_FOUNDATION_GUARDS,
  resetFinanceStoreForTests,
  TREASURY_GUARDS,
} from "@finance";

const root = join(__dirname, "../../../..");
const docs = join(root, "docs/platform/finance/banking");

afterEach(() => {
  resetFinanceStoreForTests();
});

describe("P-009 JAG Treasury & Banking", () => {
  it("bootstraps connections, multi-kind accounts, and consolidated cash", () => {
    expect(TREASURY_GUARDS.includesReconciliation).toBe(false);
    expect(TREASURY_GUARDS.includesForecasting).toBe(false);
    expect(TREASURY_GUARDS.includesAiCfo).toBe(false);
    expect(TREASURY_GUARDS.includesEbitda).toBe(false);
    expect(TREASURY_GUARDS.matchingInfrastructureOnly).toBe(true);

    const finance = createFinanceEngine();
    finance.bootstrap({
      organizationId: "org.treasury",
      userId: "u-cfo",
    });
    const treasury = createTreasuryEngine();
    const boot = treasury.bootstrapTreasury({
      organizationId: "org.treasury",
      userId: "u-cfo",
      institutionName: "First National Sandbox",
    });
    expect("error" in boot).toBe(false);
    if ("error" in boot) return;

    expect(boot.providers.plaid).toBe(true);
    expect(boot.providers.openBanking).toBe("future");
    expect(boot.operating.kind).toBe("checking");
    expect(boot.restricted.kind).toBe("restricted_cash");
    expect(boot.cash.consolidated.current).toBe(125_000);
    expect(boot.cash.consolidated.restricted).toBe(25_000);
    expect(boot.cash.consolidated.available).toBe(95_000);
    expect(boot.matching.reconciliationImplemented).toBe(false);

    const savings = treasury.createTreasuryAccount({
      organizationId: "org.treasury",
      userId: "u-cfo",
      name: "Money Market",
      kind: "money_market",
      currentBalance: 10_000,
      availableBalance: 10_000,
    });
    expect("error" in savings).toBe(false);

    const plaid = treasury.registerInstitution({
      organizationId: "org.treasury",
      userId: "u-cfo",
      name: "Plaid Sandbox CU",
      provider: "plaid",
    });
    expect("error" in plaid).toBe(false);
    if ("error" in plaid) return;
    const conn = treasury.connectInstitution({
      organizationId: "org.treasury",
      userId: "u-cfo",
      institutionId: plaid.id,
      entityId: finance.listEntities("org.treasury")[0]?.id,
    });
    expect("error" in conn).toBe(false);

    expect(treasury.listInstitutions("org.treasury").length).toBeGreaterThan(1);
    expect(finance.treasury.cashPosition("org.treasury").byAccount.length).toBeGreaterThan(
      1
    );
  });

  it("imports statements with preview, validation, commit, rollback", () => {
    const finance = createFinanceEngine();
    finance.bootstrap({ organizationId: "org.imp", userId: "u-ctrl" });
    const treasury = createTreasuryEngine();
    const bank = treasury.createTreasuryAccount({
      organizationId: "org.imp",
      userId: "u-ctrl",
      name: "Ops",
      kind: "checking",
      currentBalance: 50_000,
    });
    expect("error" in bank).toBe(false);
    if ("error" in bank) return;

    const preview = treasury.previewImport({
      organizationId: "org.imp",
      userId: "u-ctrl",
      bankAccountId: bank.id,
      format: "csv",
      fileName: "feb.csv",
      rows: [
        {
          externalId: "ext-1",
          amount: 100,
          description: "Deposit ACME",
          date: "2026-02-01",
        },
        {
          externalId: "ext-2",
          amount: -40,
          description: "ACH Vendor",
          date: "2026-02-02",
        },
      ],
    });
    expect("error" in preview).toBe(false);
    if ("error" in preview) return;
    expect(preview.status).toBe("preview");
    expect(preview.rowCount).toBe(2);

    const validated = treasury.validateImport({
      organizationId: "org.imp",
      userId: "u-ctrl",
      batchId: preview.id,
    });
    expect("error" in validated).toBe(false);
    if ("error" in validated) return;
    expect(validated.status).toBe("validated");

    const committed = treasury.commitImport({
      organizationId: "org.imp",
      userId: "u-ctrl",
      batchId: preview.id,
    });
    expect("error" in committed).toBe(false);
    if ("error" in committed) return;
    expect(committed.status).toBe("committed");
    expect(treasury.listTransactions("org.imp").length).toBe(2);

    const dupPreview = treasury.previewImport({
      organizationId: "org.imp",
      userId: "u-ctrl",
      bankAccountId: bank.id,
      format: "ofx",
      fileName: "feb.ofx",
      rows: [
        {
          externalId: "ext-1",
          amount: 100,
          description: "Deposit ACME",
          date: "2026-02-01",
        },
      ],
    });
    expect("error" in dupPreview).toBe(false);
    if ("error" in dupPreview) return;
    expect(dupPreview.duplicateCount).toBe(1);

    const pdf = treasury.previewImport({
      organizationId: "org.imp",
      userId: "u-ctrl",
      bankAccountId: bank.id,
      format: "pdf",
      fileName: "feb.pdf",
    });
    expect("error" in pdf).toBe(false);
    if ("error" in pdf) return;
    expect(pdf.metadataOnly).toBe(true);
    expect(pdf.ocrHookReady).toBe(true);

    const rolled = treasury.rollbackImport({
      organizationId: "org.imp",
      userId: "u-ctrl",
      batchId: preview.id,
    });
    expect("error" in rolled).toBe(false);
    if ("error" in rolled) return;
    expect(rolled.status).toBe("rolled_back");
    expect(
      treasury.listTransactions("org.imp").every((t) => t.status === "voided")
    ).toBe(true);
  });

  it("runs transaction engine, rules, exceptions, and matching framework", () => {
    const finance = createFinanceEngine();
    finance.bootstrap({ organizationId: "org.txn", userId: "u-ctrl" });
    const treasury = createTreasuryEngine();
    const bank = treasury.createTreasuryAccount({
      organizationId: "org.txn",
      userId: "u-ctrl",
      name: "Ops",
      kind: "checking",
      currentBalance: 200_000,
    });
    if ("error" in bank) return;

    treasury.createRule({
      organizationId: "org.txn",
      userId: "u-ctrl",
      name: "Office supplies",
      matchContains: "staples",
      category: "office",
    });

    const txn = treasury.createTransaction({
      organizationId: "org.txn",
      userId: "u-ctrl",
      bankAccountId: bank.id,
      amount: 75,
      direction: "out",
      description: "STAPLES #123",
      status: "posted",
    });
    expect("error" in txn).toBe(false);
    if ("error" in txn) return;
    expect(txn.category).toBe("office");

    const large = treasury.createTransaction({
      organizationId: "org.txn",
      userId: "u-ctrl",
      bankAccountId: bank.id,
      amount: 30_000,
      direction: "out",
      description: "Wire out",
    });
    expect("error" in large).toBe(false);
    expect(
      treasury
        .listExceptions("org.txn")
        .some((e) => e.kind === "large_transaction")
    ).toBe(true);
    expect(
      treasury
        .listNotifications("org.txn")
        .some((n) => n.kind === "large_withdrawal")
    ).toBe(true);

    const splitParent = treasury.createTransaction({
      organizationId: "org.txn",
      userId: "u-ctrl",
      bankAccountId: bank.id,
      amount: 100,
      direction: "out",
      description: "Split me",
    });
    if ("error" in splitParent) return;
    const splits = treasury.splitTransaction({
      organizationId: "org.txn",
      userId: "u-ctrl",
      transactionId: splitParent.id,
      splits: [
        { amount: 60, description: "A" },
        { amount: 40, description: "B" },
      ],
    });
    expect("error" in splits).toBe(false);
    if ("error" in splits) return;
    expect(splits).toHaveLength(2);

    const match = treasury.suggestMatch({
      organizationId: "org.txn",
      userId: "u-ctrl",
      leftType: "transaction",
      leftId: txn.id,
      rightType: "bill",
      rightId: "bill:1",
      score: 0.9,
    });
    expect("error" in match).toBe(false);
    if ("error" in match) return;
    const accepted = treasury.acceptMatch({
      organizationId: "org.txn",
      userId: "u-ctrl",
      matchId: match.id,
    });
    expect("error" in accepted).toBe(false);
    if ("error" in accepted) return;
    expect(accepted.status).toBe("accepted");
    expect(treasury.matchingCapabilities().reconciliationImplemented).toBe(
      false
    );
  });

  it("enforces transfer approvals, dual auth, and cash movement", () => {
    const finance = createFinanceEngine();
    finance.bootstrap({ organizationId: "org.xfer", userId: "u-cfo" });
    finance.grantRoles({
      organizationId: "org.xfer",
      userId: "u-approver",
      roles: Object.freeze(["approve", "post"]),
      actorUserId: "u-cfo",
    });
    finance.grantRoles({
      organizationId: "org.xfer",
      userId: "u-approver-2",
      roles: Object.freeze(["approve", "post"]),
      actorUserId: "u-cfo",
    });

    const treasury = createTreasuryEngine();
    treasury.setApprovalPolicy({
      organizationId: "org.xfer",
      userId: "u-cfo",
      singleApprovalLimit: 1_000,
      dualAuthLimit: 10_000,
      largeTransactionThreshold: 20_000,
    });

    const from = treasury.createTreasuryAccount({
      organizationId: "org.xfer",
      userId: "u-cfo",
      name: "From",
      kind: "checking",
      currentBalance: 50_000,
      availableBalance: 50_000,
    });
    const to = treasury.createTreasuryAccount({
      organizationId: "org.xfer",
      userId: "u-cfo",
      name: "To",
      kind: "savings",
      currentBalance: 0,
      availableBalance: 0,
    });
    if ("error" in from || "error" in to) return;

    const small = treasury.requestTransfer({
      organizationId: "org.xfer",
      userId: "u-cfo",
      kind: "internal",
      fromBankAccountId: from.id,
      toBankAccountId: to.id,
      amount: 500,
    });
    expect("error" in small).toBe(false);
    if ("error" in small) return;
    expect(small.status).toBe("approved");
    const executedSmall = treasury.executeTransfer({
      organizationId: "org.xfer",
      userId: "u-cfo",
      transferRequestId: small.id,
    });
    expect("error" in executedSmall).toBe(false);

    const dual = treasury.requestTransfer({
      organizationId: "org.xfer",
      userId: "u-cfo",
      kind: "wire",
      fromBankAccountId: from.id,
      toBankAccountId: to.id,
      amount: 15_000,
    });
    expect("error" in dual).toBe(false);
    if ("error" in dual) return;
    expect(dual.requiresDualAuth).toBe(true);
    expect(dual.status).toBe("pending_approval");

    const selfApprove = treasury.approveTransfer({
      organizationId: "org.xfer",
      userId: "u-cfo",
      transferRequestId: dual.id,
    });
    expect("error" in selfApprove).toBe(true);

    const a1 = treasury.approveTransfer({
      organizationId: "org.xfer",
      userId: "u-approver",
      transferRequestId: dual.id,
    });
    expect("error" in a1).toBe(false);
    if ("error" in a1) return;
    expect(a1.status).toBe("pending_approval");

    const a2 = treasury.approveTransfer({
      organizationId: "org.xfer",
      userId: "u-approver-2",
      transferRequestId: dual.id,
    });
    expect("error" in a2).toBe(false);
    if ("error" in a2) return;
    expect(a2.status).toBe("approved");

    const executed = treasury.executeTransfer({
      organizationId: "org.xfer",
      userId: "u-approver",
      transferRequestId: dual.id,
    });
    expect("error" in executed).toBe(false);
    if ("error" in executed) return;
    expect(executed.status).toBe("executed");

    const cash = treasury.cashPosition("org.xfer");
    expect(cash.consolidated.current).toBe(50_000);
    expect(
      cash.byAccount.find((a) => a.bankAccountId === to.id)?.current
    ).toBe(15_500);
  });

  it("regresses P-008 finance foundation and ships banking docs/APIs", () => {
    expect(FINANCE_FOUNDATION_GUARDS.includesReconciliation).toBe(false);
    const engine = createFinanceEngine();
    const boot = engine.bootstrap({
      organizationId: "org.reg",
      userId: "u-cfo",
      coaTemplate: "corporate",
    });
    expect("error" in boot).toBe(false);
    if ("error" in boot) return;

    const bank = engine.createBankAccount({
      organizationId: "org.reg",
      userId: "u-cfo",
      name: "Legacy Ops",
      kind: "bank",
      mask: "1111",
    });
    expect("error" in bank).toBe(false);
    if ("error" in bank) return;
    expect(bank.mask).toContain("1111");

    const imp = engine.importBankStatement({
      organizationId: "org.reg",
      userId: "u-cfo",
      bankAccountId: bank.id,
      format: "csv",
      fileName: "legacy.csv",
      rowCount: 3,
    });
    expect("error" in imp).toBe(false);

    for (const name of [
      "01_ARCHITECTURE.md",
      "02_CONNECTIONS.md",
      "03_TREASURY.md",
      "04_TRANSACTIONS.md",
      "05_SECURITY.md",
      "06_API.md",
    ]) {
      expect(existsSync(join(docs, name))).toBe(true);
    }
    for (const route of [
      "src/app/api/finance/banking/connections/route.ts",
      "src/app/api/finance/banking/accounts/route.ts",
      "src/app/api/finance/banking/transactions/route.ts",
      "src/app/api/finance/banking/statements/route.ts",
      "src/app/api/finance/banking/transfers/route.ts",
      "src/app/api/finance/banking/cash/route.ts",
    ]) {
      expect(existsSync(join(root, route))).toBe(true);
    }

    const modules = [
      "connections",
      "institutions",
      "accounts",
      "transactions",
      "statements",
      "imports",
      "exports",
      "treasury",
      "cash",
      "payments",
      "transfers",
      "rules",
      "matching",
      "exceptions",
      "security",
      "notifications",
    ];
    for (const m of modules) {
      expect(
        existsSync(join(root, `packages/platform/finance/banking/${m}/index.ts`))
      ).toBe(true);
    }
  });
});
