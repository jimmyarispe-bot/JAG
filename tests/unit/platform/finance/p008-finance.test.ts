/**
 * Platform Sprint P-008 — JAG Finance™ Foundation
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  COA_TEMPLATES,
  createFinanceEngine,
  FINANCE_FOUNDATION_GUARDS,
  resetFinanceStoreForTests,
} from "@finance";
import {
  createUniversalOrganizationEngine,
  resetOrganizationStoreForTests,
} from "@organization";

const root = join(__dirname, "../../../..");
const docs = join(root, "docs/platform/finance");

afterEach(() => {
  resetFinanceStoreForTests();
  resetOrganizationStoreForTests();
});

describe("P-008 JAG Finance Foundation", () => {
  it("bootstraps multi-entity COA and posts balanced journals", () => {
    const engine = createFinanceEngine();
    expect(FINANCE_FOUNDATION_GUARDS.includesReconciliation).toBe(false);
    expect(FINANCE_FOUNDATION_GUARDS.includesAiCfo).toBe(false);
    expect(FINANCE_FOUNDATION_GUARDS.includesForecasting).toBe(false);
    expect(FINANCE_FOUNDATION_GUARDS.includesEbitda).toBe(false);
    expect(COA_TEMPLATES).toContain("nonprofit");

    const boot = engine.bootstrap({
      organizationId: "org.fin",
      userId: "u-cfo",
      entityName: "Parent Co",
      coaTemplate: "corporate",
    });
    expect("error" in boot).toBe(false);
    if ("error" in boot) return;

    const sub = engine.createEntity({
      organizationId: "org.fin",
      userId: "u-cfo",
      name: "Campus A",
      kind: "campus",
      parentEntityId: boot.entity.id,
    });
    expect("error" in sub).toBe(false);
    if ("error" in sub) return;

    const link = engine.linkIntercompany({
      organizationId: "org.fin",
      userId: "u-cfo",
      fromEntityId: boot.entity.id,
      toEntityId: sub.id,
      relationship: "parent-subsidiary",
    });
    expect("error" in link).toBe(false);

    const cash = boot.accounts.find((a) => a.number === "1000")!;
    const revenue = boot.accounts.find((a) => a.number === "4000")!;

    const unbalanced = engine.createJournal({
      organizationId: "org.fin",
      userId: "u-cfo",
      description: "Bad",
      lines: [{ accountId: cash.id, debit: 100 }],
    });
    expect("error" in unbalanced).toBe(true);

    const draft = engine.createJournal({
      organizationId: "org.fin",
      userId: "u-cfo",
      description: "Cash sale",
      entityId: boot.entity.id,
      lines: [
        { accountId: cash.id, debit: 500 },
        { accountId: revenue.id, credit: 500 },
      ],
    });
    expect("error" in draft).toBe(false);
    if ("error" in draft) return;

    const approved = engine.approveJournal({
      organizationId: "org.fin",
      userId: "u-cfo",
      journalId: draft.id,
    });
    expect("error" in approved).toBe(false);

    const posted = engine.postJournal({
      organizationId: "org.fin",
      userId: "u-cfo",
      journalId: draft.id,
    });
    expect("error" in posted).toBe(false);
    if ("error" in posted) return;
    expect(posted.status).toBe("posted");

    const locked = engine.lockPeriod({
      organizationId: "org.fin",
      userId: "u-cfo",
      periodKey: posted.periodKey,
    });
    expect("error" in locked).toBe(false);

    const blocked = engine.createJournal({
      organizationId: "org.fin",
      userId: "u-cfo",
      description: "After lock",
      periodKey: posted.periodKey,
      lines: [
        { accountId: cash.id, debit: 10 },
        { accountId: revenue.id, credit: 10 },
      ],
    });
    expect("error" in blocked).toBe(true);

    expect(engine.listAudit("org.fin").length).toBeGreaterThan(0);
    expect(engine.dashboard("org.fin").foundationOnly).toBe(true);
  });

  it("supports banking, vendors, customers, AP/AR, budgets, permissions", () => {
    const engine = createFinanceEngine();
    engine.bootstrap({
      organizationId: "org.ops",
      userId: "u-ctrl",
      coaTemplate: "education",
    });

    const bank = engine.createBankAccount({
      organizationId: "org.ops",
      userId: "u-ctrl",
      name: "Operating",
      kind: "bank",
      mask: "1234",
    });
    expect("error" in bank).toBe(false);
    if ("error" in bank) return;

    const csv = engine.importBankStatement({
      organizationId: "org.ops",
      userId: "u-ctrl",
      bankAccountId: bank.id,
      format: "csv",
      fileName: "jan.csv",
      rowCount: 12,
    });
    expect("error" in csv).toBe(false);
    if ("error" in csv) return;
    expect(csv.metadataOnly).toBe(false);

    const pdf = engine.importBankStatement({
      organizationId: "org.ops",
      userId: "u-ctrl",
      bankAccountId: bank.id,
      format: "pdf",
      fileName: "jan.pdf",
    });
    expect("error" in pdf).toBe(false);
    if ("error" in pdf) return;
    expect(pdf.metadataOnly).toBe(true);

    expect(engine.plaidInterface().ready).toBe(true);

    const vendor = engine.createVendor({
      organizationId: "org.ops",
      userId: "u-ctrl",
      name: "Office Supplies Co",
      is1099: true,
    });
    expect("error" in vendor).toBe(false);
    if ("error" in vendor) return;

    const customer = engine.createCustomer({
      organizationId: "org.ops",
      userId: "u-ctrl",
      name: "Family Smith",
      kind: "family",
    });
    expect("error" in customer).toBe(false);
    if ("error" in customer) return;

    const bill = engine.createBill({
      organizationId: "org.ops",
      userId: "u-ctrl",
      vendorId: vendor.id,
      amount: 250,
      dueAt: new Date(Date.now() - 86400000 * 40).toISOString(),
    });
    expect("error" in bill).toBe(false);
    if ("error" in bill) return;
    engine.approveBill({
      organizationId: "org.ops",
      userId: "u-ctrl",
      billId: bill.id,
    });
    engine.payBill({
      organizationId: "org.ops",
      userId: "u-ctrl",
      billId: bill.id,
    });

    const invoice = engine.createInvoice({
      organizationId: "org.ops",
      userId: "u-ctrl",
      customerId: customer.id,
      amount: 1000,
    });
    expect("error" in invoice).toBe(false);
    if ("error" in invoice) return;
    engine.sendInvoice({
      organizationId: "org.ops",
      userId: "u-ctrl",
      invoiceId: invoice.id,
    });
    engine.receivePayment({
      organizationId: "org.ops",
      userId: "u-ctrl",
      invoiceId: invoice.id,
    });

    const accounts = engine.listAccounts("org.ops");
    const budget = engine.createBudget({
      organizationId: "org.ops",
      userId: "u-ctrl",
      name: "FY Budget",
      horizon: "annual",
      scope: "organization",
      periodKey: "2026",
      lines: [{ accountId: accounts[0]!.id, amount: 100000 }],
      scenarioKey: "base",
    });
    expect("error" in budget).toBe(false);

    expect(engine.payablesAging("org.ops").length).toBe(5);
    expect(engine.receivablesAging("org.ops").length).toBe(5);
    expect(engine.hasPermission({
      organizationId: "org.ops",
      userId: "u-ctrl",
      role: "post",
    })).toBe(true);

    // Auditor read-only grant
    engine.grantRoles({
      organizationId: "org.ops",
      userId: "u-auditor",
      roles: Object.freeze(["auditor"]),
      actorUserId: "u-ctrl",
    });
    expect(
      engine.hasPermission({
        organizationId: "org.ops",
        userId: "u-auditor",
        role: "read",
      })
    ).toBe(true);
    expect(
      engine.hasPermission({
        organizationId: "org.ops",
        userId: "u-auditor",
        role: "post",
      })
    ).toBe(false);
  });

  it("remains governance-aware with Universal Organization Model", () => {
    const org = createUniversalOrganizationEngine().bootstrap({
      organizationId: "org.gov",
      legalName: "Gov Aware Nonprofit",
      governanceProfileId: "nonprofit",
    });
    expect(org.finance.notes).toMatch(/Finance/i);

    const engine = createFinanceEngine();
    const boot = engine.bootstrap({
      organizationId: "org.gov",
      userId: "u-cfo",
      coaTemplate: "nonprofit",
    });
    expect("error" in boot).toBe(false);
    if ("error" in boot) return;
    expect(
      boot.accounts.some((a) => a.name.toLowerCase().includes("grant"))
    ).toBe(true);
  });

  it("ships finance documentation and API routes", () => {
    for (const name of [
      "01_ARCHITECTURE.md",
      "02_FINANCIAL_MODEL.md",
      "03_MULTI_ENTITY.md",
      "04_LEDGER.md",
      "05_SECURITY.md",
      "06_API.md",
    ]) {
      expect(existsSync(join(docs, name))).toBe(true);
    }
    for (const route of [
      "src/app/api/finance/entities/route.ts",
      "src/app/api/finance/accounts/route.ts",
      "src/app/api/finance/journals/route.ts",
      "src/app/api/finance/vendors/route.ts",
      "src/app/api/finance/customers/route.ts",
      "src/app/api/finance/budgets/route.ts",
      "src/app/api/finance/banking/route.ts",
    ]) {
      expect(existsSync(join(root, route))).toBe(true);
    }
  });
});
