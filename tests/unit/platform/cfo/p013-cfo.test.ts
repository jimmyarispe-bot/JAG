/**
 * Platform Sprint P-013 — JAG CFO™ Financial Reasoning Engine
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  CFO_GUARDS,
  CFO_SINKS,
  CFO_VERSION,
  createChiefFinancialOfficerEngine,
  METRIC_REGISTRY,
  resetCfoStoreForTests,
} from "@cfo";
import {
  createFinanceEngine,
  resetFinanceStoreForTests,
} from "@finance";

const root = join(__dirname, "../../../..");
const docs = join(root, "docs/platform/cfo");

afterEach(() => {
  resetFinanceStoreForTests();
  resetCfoStoreForTests();
});

function boot(org: string) {
  const finance = createFinanceEngine();
  const boot = finance.bootstrap({
    organizationId: org,
    userId: "u-cfo",
    coaTemplate: "corporate",
  });
  if ("error" in boot) throw new Error("bootstrap failed");
  const cash = boot.accounts.find((a) => a.number === "1000")!;
  const revenue = boot.accounts.find((a) => a.number === "4000")!;
  const expense = boot.accounts.find((a) => a.type === "expense")!;
  const draft = finance.createJournal({
    organizationId: org,
    userId: "u-cfo",
    description: "Ops",
    entityId: boot.entity.id,
    periodKey: "2026-07",
    lines: [
      { accountId: cash.id, debit: 2000 },
      { accountId: revenue.id, credit: 2000 },
    ],
  });
  if ("error" in draft) throw new Error("journal failed");
  finance.approveJournal({
    organizationId: org,
    userId: "u-cfo",
    journalId: draft.id,
  });
  finance.postJournal({
    organizationId: org,
    userId: "u-cfo",
    journalId: draft.id,
  });
  finance.createBankAccount({
    organizationId: org,
    userId: "u-cfo",
    name: "Operating",
    kind: "bank",
    currency: "USD",
  });
  // set cash hint via treasury store if supported — use list and update through create with balance
  const banks = finance.listBankAccounts(org);
  if (banks[0] && "currentBalance" in banks[0] === false) {
    /* foundation may not set balance; runway still computes */
  }
  void expense;
  return { finance, entity: boot.entity, accounts: boot.accounts };
}

describe("P-013 JAG CFO", () => {
  it("guards: recommends only, consumes engines, no ledger duplication", () => {
    expect(CFO_GUARDS.recommendsOnly).toBe(true);
    expect(CFO_GUARDS.modifiesAccountingRecords).toBe(false);
    expect(CFO_GUARDS.duplicatesLedger).toBe(false);
    expect(CFO_GUARDS.duplicatesReporting).toBe(false);
    expect(CFO_GUARDS.metricRegistryRequired).toBe(true);
    expect(CFO_SINKS.digitalTwin).toBe(true);
    expect(CFO_VERSION).toBe("1.0.0");
  });

  it("ships documentation and metric registry lineage", () => {
    for (const f of [
      "01_ARCHITECTURE.md",
      "02_FINANCIAL_REASONING.md",
      "03_METRICS.md",
      "04_SCENARIOS.md",
      "05_BOARD_REPORTING.md",
      "06_API.md",
    ]) {
      expect(existsSync(join(docs, f))).toBe(true);
    }
    expect(METRIC_REGISTRY.length).toBe(15);
    for (const m of METRIC_REGISTRY) {
      expect(m.definition.length).toBeGreaterThan(0);
      expect(m.formula.length).toBeGreaterThan(0);
      expect(m.dataLineage.length).toBeGreaterThan(0);
      expect(m.version).toBeTruthy();
      expect(m.dimensions.length).toBeGreaterThan(0);
    }
  });

  it("evaluates metrics via registry with lineage over FinanceEngine data", () => {
    boot("org.cfo.metrics");
    const cfo = createChiefFinancialOfficerEngine();
    expect(cfo.guards).toBe(CFO_GUARDS);
    const snap = cfo.evaluateMetrics({
      organizationId: "org.cfo.metrics",
      periodKey: "2026-07",
    });
    expect(snap.metrics.revenue.value).toBe(2000);
    expect(snap.metrics.net_income.value).toBe(2000);
    expect(snap.metrics.ebitda.value).toBeDefined();
    expect(snap.metrics.ebitda.sourceRefs).toBeDefined();
  });

  it("computes EBITDA, adjusted EBITDA with adjustment audit trail", () => {
    boot("org.cfo.ebitda");
    const cfo = createChiefFinancialOfficerEngine();
    const adj = cfo.recordEbitdaAdjustment({
      organizationId: "org.cfo.ebitda",
      userId: "u-cfo",
      kind: "one_time",
      label: "Legal settlement",
      amount: 100,
      periodKey: "2026-07",
      rationale: "Non-recurring legal",
      evidenceRefs: [{ recordType: "note", recordId: "n1" }],
    });
    expect(adj.evidenceRefs.length).toBe(1);
    const report = cfo.computeEbitda({
      organizationId: "org.cfo.ebitda",
      userId: "u-cfo",
      periodKey: "2026-07",
    });
    expect(report.adjustedEbitda).toBe(report.ebitda + 100);
    expect(report.adjustments).toHaveLength(1);
    expect(
      cfo.listEvents("org.cfo.ebitda").some((e) => e.type === "cfo.ebitda_computed")
    ).toBe(true);
  });

  it("computes QoE, runway, valuation", () => {
    boot("org.cfo.pack");
    const cfo = createChiefFinancialOfficerEngine();
    const qoe = cfo.computeQoe({
      organizationId: "org.cfo.pack",
      userId: "u-cfo",
      periodKey: "2026-07",
    });
    expect(qoe.revenueQualityScore).toBeGreaterThan(0);

    const runway = cfo.computeRunway({
      organizationId: "org.cfo.pack",
      userId: "u-cfo",
      periodKey: "2026-07",
      monthlyBurn: 500,
    });
    expect(runway.sensitivity.best_case).toBeDefined();
    expect(runway.sensitivity.worst_case).toBeDefined();

    const val = cfo.computeValuation({
      organizationId: "org.cfo.pack",
      userId: "u-cfo",
      periodKey: "2026-07",
      approach: "ebitda_multiple",
      multiple: 5,
    });
    expect(val.value).toBe((cfo.evaluateMetrics({
      organizationId: "org.cfo.pack",
      periodKey: "2026-07",
    }).metrics.ebitda.value ?? 0) * 5);

    const dcf = cfo.computeValuation({
      organizationId: "org.cfo.pack",
      userId: "u-cfo",
      periodKey: "2026-07",
      approach: "dcf_placeholder",
    });
    expect(dcf.value).toBeNull();
    expect(dcf.notes).toMatch(/placeholder/i);
  });

  it("runs scenario analysis and recommendations with evidence", () => {
    boot("org.cfo.scen");
    const cfo = createChiefFinancialOfficerEngine();
    const scen = cfo.analyzeScenario({
      organizationId: "org.cfo.scen",
      userId: "u-cfo",
      kind: "enrollment_changes",
      name: "Drop 12%",
      periodKey: "2026-07",
      assumptions: { changePct: -12 },
    });
    expect(scen.projectedRevenue).toBe(2000 * 0.88);

    const recs = cfo.generateRecommendations({
      organizationId: "org.cfo.scen",
      userId: "u-cfo",
      periodKey: "2026-07",
    });
    expect(recs.length).toBeGreaterThan(0);
    for (const r of recs) {
      expect(r.supportingEvidence.length).toBeGreaterThan(0);
      expect(r.assumptions.length).toBeGreaterThan(0);
      expect(r.alternatives.length).toBeGreaterThan(0);
      expect(r.confidence).toBeGreaterThan(0);
      expect(typeof r.financialImpact).toBe("number");
    }
  });

  it("builds board report and publishes twin/evidence/memory", () => {
    boot("org.cfo.board");
    const cfo = createChiefFinancialOfficerEngine();
    const board = cfo.buildBoardReport({
      organizationId: "org.cfo.board",
      userId: "u-cfo",
      periodKey: "2026-07",
    });
    expect(board.executiveSummary.length).toBeGreaterThan(0);
    expect(board.recommendations.length).toBeGreaterThan(0);
    expect(board.actionItems.length).toBeGreaterThan(0);
    expect(cfo.listTwinProjections("org.cfo.board").length).toBeGreaterThan(0);
    expect(cfo.listEvidenceRecords("org.cfo.board").length).toBeGreaterThan(0);
    expect(cfo.listMemoryRecords("org.cfo.board").length).toBeGreaterThan(0);
  });

  it("answers conversational finance queries", () => {
    boot("org.cfo.ask");
    const cfo = createChiefFinancialOfficerEngine();
    const runway = cfo.ask({
      organizationId: "org.cfo.ask",
      userId: "u-cfo",
      question: "How much cash runway do we have?",
      periodKey: "2026-07",
    });
    expect(runway.answer).toMatch(/runway/i);
    expect(runway.metricKeys).toContain("cash");

    const ebitda = cfo.ask({
      organizationId: "org.cfo.ask",
      userId: "u-cfo",
      question: "Why did EBITDA decline?",
      periodKey: "2026-07",
    });
    expect(ebitda.answer).toMatch(/EBITDA/i);

    const enroll = cfo.ask({
      organizationId: "org.cfo.ask",
      userId: "u-cfo",
      question: "What happens if enrollment drops 12%?",
      periodKey: "2026-07",
    });
    expect(enroll.answer).toMatch(/12|revenue/i);

    const risks = cfo.ask({
      organizationId: "org.cfo.ask",
      userId: "u-cfo",
      question: "What are our largest financial risks?",
      periodKey: "2026-07",
    });
    expect(risks.answer.length).toBeGreaterThan(10);
  });

  it("regressions: reporting statements and planning still available", () => {
    const { finance } = boot("org.cfo.reg");
    const stmt = finance.reportingOps.generateStatement({
      organizationId: "org.cfo.reg",
      userId: "u-cfo",
      kind: "income_statement",
      periodKey: "2026-07",
      scope: "consolidated",
    });
    expect(stmt.totals.revenue).toBe(2000);
    const budget = finance.planning.createBudget({
      organizationId: "org.cfo.reg",
      userId: "u-cfo",
      name: "FY",
      horizon: "annual",
      kind: "operating",
      periodKey: "2026",
      lines: [],
    });
    expect("error" in budget).toBe(false);
  });
});
