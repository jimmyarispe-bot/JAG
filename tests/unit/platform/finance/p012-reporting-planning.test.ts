/**
 * Platform Sprint P-012 — Financial Planning, Reporting & Executive Intelligence Foundation
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  createFinanceEngine,
  createFinancialPlanningEngine,
  createFinancialReportingEngine,
  FINANCE_VERSION,
  OPERATIONAL_SINKS,
  PLANNING_GUARDS,
  REPORTING_GUARDS,
  resetFinanceStoreForTests,
} from "@finance";

const root = join(__dirname, "../../../..");
const docs = join(root, "docs/platform/finance/reporting");

afterEach(() => {
  resetFinanceStoreForTests();
});

function boot(org: string) {
  const finance = createFinanceEngine();
  const boot = finance.bootstrap({
    organizationId: org,
    userId: "u-cfo",
    coaTemplate: "corporate",
  });
  expect("error" in boot).toBe(false);
  if ("error" in boot) throw new Error("bootstrap failed");
  return { finance, entity: boot.entity, accounts: boot.accounts };
}

function postSale(
  finance: ReturnType<typeof createFinanceEngine>,
  org: string,
  accounts: { number: string; id: string }[],
  entityId: string,
  amount: number,
  periodKey = "2026-07"
) {
  const cash = accounts.find((a) => a.number === "1000")!;
  const revenue = accounts.find((a) => a.number === "4000")!;
  const draft = finance.createJournal({
    organizationId: org,
    userId: "u-cfo",
    description: "Sale",
    entityId,
    periodKey,
    lines: [
      { accountId: cash.id, debit: amount },
      { accountId: revenue.id, credit: amount },
    ],
  });
  expect("error" in draft).toBe(false);
  if ("error" in draft) throw new Error("journal failed");
  finance.approveJournal({
    organizationId: org,
    userId: "u-cfo",
    journalId: draft.id,
  });
  const posted = finance.postJournal({
    organizationId: org,
    userId: "u-cfo",
    journalId: draft.id,
  });
  expect("error" in posted).toBe(false);
  if ("error" in posted) throw new Error("post failed");
  return posted;
}

describe("P-012 Financial Reporting & Planning", () => {
  it("guards exclude AI CFO / EBITDA calcs / runway / valuation; sinks enabled", () => {
    expect(REPORTING_GUARDS.includesAiCfo).toBe(false);
    expect(REPORTING_GUARDS.includesEbitdaCalculations).toBe(false);
    expect(REPORTING_GUARDS.includesCashRunway).toBe(false);
    expect(REPORTING_GUARDS.ebitdaPlaceholderOnly).toBe(true);
    expect(REPORTING_GUARDS.consumesFinanceEngine).toBe(true);
    expect(PLANNING_GUARDS.includesAiRecommendations).toBe(false);
    expect(PLANNING_GUARDS.cashForecastPlaceholderOnly).toBe(true);
    expect(OPERATIONAL_SINKS.digitalTwin).toBe(true);
    expect(OPERATIONAL_SINKS.evidenceLedger).toBe(true);
    expect(OPERATIONAL_SINKS.organizationalMemory).toBe(true);
    expect(FINANCE_VERSION).toBe("1.4.0");
  });

  it("documents all required reporting docs", () => {
    for (const f of [
      "01_ARCHITECTURE.md",
      "02_FINANCIAL_STATEMENTS.md",
      "03_PLANNING.md",
      "04_VARIANCE.md",
      "05_DASHBOARDS.md",
      "06_API.md",
    ]) {
      expect(existsSync(join(docs, f))).toBe(true);
    }
  });

  it("wires reportingOps and planning on FinanceEngine", () => {
    const finance = createFinanceEngine();
    expect(finance.reportingOps.guards).toBe(REPORTING_GUARDS);
    expect(finance.planning.guards).toBe(PLANNING_GUARDS);
    expect(finance.dashboard("org.x").foundationOnly).toBe(true);
  });

  it("generates financial statements with drill-down source refs", () => {
    const { finance, entity, accounts } = boot("org.stmt");
    const posted = postSale(finance, "org.stmt", accounts, entity.id, 1000);
    const reporting = createFinancialReportingEngine();

    const is = reporting.generateStatement({
      organizationId: "org.stmt",
      userId: "u-cfo",
      kind: "income_statement",
      periodKey: posted.periodKey,
      scope: "consolidated",
    });
    expect(is.totals.revenue).toBe(1000);
    expect(is.totals.netIncome).toBe(1000);
    expect(is.lines.some((l) => l.sourceRefs.length > 0)).toBe(true);

    const bs = reporting.generateStatement({
      organizationId: "org.stmt",
      userId: "u-cfo",
      kind: "balance_sheet",
      periodKey: posted.periodKey,
      scope: "entity",
      scopeId: entity.id,
    });
    expect(bs.totals.assets).toBeGreaterThan(0);

    const tb = reporting.trialBalance({
      organizationId: "org.stmt",
      userId: "u-cfo",
      periodKey: posted.periodKey,
      scope: "consolidated",
    });
    expect(tb.totals.totalDebits).toBe(tb.totals.totalCredits);

    const gl = reporting.generateStatement({
      organizationId: "org.stmt",
      userId: "u-cfo",
      kind: "general_ledger",
      periodKey: posted.periodKey,
    });
    expect(gl.lines.length).toBeGreaterThan(0);

    const cf = reporting.generateStatement({
      organizationId: "org.stmt",
      userId: "u-cfo",
      kind: "cash_flow",
      periodKey: posted.periodKey,
    });
    expect(cf.kind).toBe("cash_flow");

    const eq = reporting.generateStatement({
      organizationId: "org.stmt",
      userId: "u-cfo",
      kind: "equity_changes",
      periodKey: posted.periodKey,
    });
    expect(eq.kind).toBe("equity_changes");

    expect(
      reporting.listOperationalEvents("org.stmt").some(
        (e) => e.type === "finance.report_generated"
      )
    ).toBe(true);
    expect(reporting.listTwinProjections("org.stmt").length).toBeGreaterThan(0);
    expect(reporting.listEvidenceRecords("org.stmt").length).toBeGreaterThan(0);
    expect(reporting.listMemoryRecords("org.stmt").length).toBeGreaterThan(0);
  });

  it("supports unlimited dimensions and filtered reporting", () => {
    const { finance, entity, accounts } = boot("org.dim");
    const posted = postSale(finance, "org.dim", accounts, entity.id, 250);
    const reporting = createFinancialReportingEngine();
    const campus = reporting.defineDimension({
      organizationId: "org.dim",
      key: "Campus",
      label: "Campus",
    });
    expect(campus.key).toBe("campus");
    reporting.setDimensionValue({
      organizationId: "org.dim",
      dimensionId: campus.id,
      code: "north",
      label: "North",
    });
    reporting.tagRecord({
      organizationId: "org.dim",
      recordType: "journal",
      recordId: posted.id,
      dimensionKey: "campus",
      dimensionValueCode: "north",
    });

    const filtered = reporting.generateStatement({
      organizationId: "org.dim",
      userId: "u-cfo",
      kind: "income_statement",
      periodKey: posted.periodKey,
      scope: "custom",
      dimensionFilters: { campus: "north" },
    });
    expect(filtered.totals.revenue).toBe(250);

    const miss = reporting.generateStatement({
      organizationId: "org.dim",
      userId: "u-cfo",
      kind: "income_statement",
      periodKey: posted.periodKey,
      dimensionFilters: { campus: "south" },
    });
    expect(miss.totals.revenue ?? 0).toBe(0);
  });

  it("runs budget, forecast, scenario engines with versioning", () => {
    const { finance, accounts } = boot("org.plan");
    const revenue = accounts.find((a) => a.number === "4000")!;
    const planning = createFinancialPlanningEngine();

    const budget = planning.createBudget({
      organizationId: "org.plan",
      userId: "u-cfo",
      name: "FY26 Operating",
      horizon: "annual",
      kind: "operating",
      periodKey: "2026",
      lines: [{ accountId: revenue.id, amount: 5000 }],
    });
    expect("error" in budget).toBe(false);
    if ("error" in budget) return;
    expect(budget.foundationBudgetId).toBeTruthy();
    expect(budget.version).toBe(1);

    const v2 = planning.versionBudget({
      organizationId: "org.plan",
      userId: "u-cfo",
      budgetId: budget.id,
      lines: [{ accountId: revenue.id, amount: 6000 }],
    });
    expect("error" in v2).toBe(false);
    if ("error" in v2) return;
    expect(v2.version).toBe(2);
    expect(v2.parentBudgetId).toBe(budget.id);

    const assumption = planning.setAssumption({
      organizationId: "org.plan",
      userId: "u-cfo",
      key: "enrollment_growth",
      label: "Enrollment growth %",
      value: 0.05,
    });
    expect(assumption.version).toBe(1);

    const scenario = planning.createScenario({
      organizationId: "org.plan",
      userId: "u-cfo",
      name: "Base",
      kind: "expected",
      assumptionIds: [assumption.id],
    });
    const worstAsm = planning.setAssumption({
      organizationId: "org.plan",
      userId: "u-cfo",
      key: "enrollment_growth",
      label: "Enrollment growth %",
      value: -0.1,
      scenarioId: null,
    });
    const worst = planning.createScenario({
      organizationId: "org.plan",
      userId: "u-cfo",
      name: "Downside",
      kind: "worst_case",
      assumptionIds: [worstAsm.id],
    });
    const cmp = planning.compareScenarios({
      organizationId: "org.plan",
      scenarioIds: [scenario.id, worst.id],
    });
    expect(cmp.assumptionDiffs.length).toBeGreaterThan(0);

    const forecast = planning.createForecast({
      organizationId: "org.plan",
      userId: "u-cfo",
      name: "Q3 Rolling",
      method: "rolling",
      periodKey: "2026-07",
      lines: [{ label: "4000", amount: 5500, accountId: revenue.id }],
      scenarioId: scenario.id,
    });
    expect(forecast.version).toBe(1);
    expect(forecast.cashPlaceholder).toBe(false);

    const cashFc = planning.createForecast({
      organizationId: "org.plan",
      userId: "u-cfo",
      name: "Cash",
      method: "cash_placeholder",
      periodKey: "2026-07",
      lines: [{ label: "cash", amount: 0 }],
    });
    expect(cashFc.cashPlaceholder).toBe(true);

    const expense = accounts.find((a) => a.type === "expense")!;
    if (expense) {
      planning.postAllocation({
        organizationId: "org.plan",
        userId: "u-cfo",
        name: "Dept split",
        fromAccountId: revenue.id,
        toAccountId: expense.id,
        amount: 100,
        periodKey: "2026-07",
      });
    }

    expect(planning.modelSnapshot("org.plan").budgetCount).toBeGreaterThan(0);
    expect(
      planning.listOperationalEvents("org.plan").some(
        (e) => e.type === "finance.budget_created"
      )
    ).toBe(true);
    expect(finance.listBudgets("org.plan").length).toBeGreaterThan(0);
  });

  it("computes variance and executive dashboard with ebitda placeholder", () => {
    const { finance, entity, accounts } = boot("org.var");
    const revenue = accounts.find((a) => a.number === "4000")!;
    postSale(finance, "org.var", accounts, entity.id, 800, "2026-07");
    const planning = createFinancialPlanningEngine();
    const budget = planning.createBudget({
      organizationId: "org.var",
      userId: "u-cfo",
      name: "July",
      horizon: "monthly",
      kind: "operating",
      periodKey: "2026-07",
      lines: [{ accountId: revenue.id, amount: 1000 }],
    });
    expect("error" in budget).toBe(false);
    if ("error" in budget) return;

    const reporting = createFinancialReportingEngine();
    const variance = reporting.computeVariance({
      organizationId: "org.var",
      userId: "u-cfo",
      mode: "budget_vs_actual",
      periodKey: "2026-07",
      budgetId: budget.foundationBudgetId!,
    });
    expect(variance.rows.length).toBe(1);
    expect(variance.rows[0]!.actual).toBe(800);
    expect(variance.rows[0]!.dollarVariance).toBe(-200);

    const fcVar = reporting.computeVariance({
      organizationId: "org.var",
      userId: "u-cfo",
      mode: "forecast_vs_actual",
      periodKey: "2026-07",
      forecastLines: [{ label: "4000", amount: 900 }],
    });
    expect(fcVar.rows[0]!.dollarVariance).toBe(-100);

    const dash = reporting.buildDashboard({
      organizationId: "org.var",
      userId: "u-cfo",
      kind: "executive",
      periodKey: "2026-07",
      customKpis: { nps: 72 },
    });
    expect(dash.drillDownReady).toBe(true);
    expect(dash.kpis.ebitdaPlaceholder).toBeNull();
    expect(dash.kpis.revenue).toBe(800);
    expect(dash.kpis.custom.nps).toBe(72);
    expect(dash.statementSummaries.length).toBe(3);

    const exp = reporting.exportReport({
      organizationId: "org.var",
      format: "csv",
      sourceType: "statement",
      sourceId: reporting.listStatements("org.var")[0]!.id,
    });
    expect(exp.content.length).toBeGreaterThan(0);

    const jsonExp = reporting.exportReport({
      organizationId: "org.var",
      format: "json",
      sourceType: "variance",
      sourceId: variance.id,
    });
    expect(jsonExp.content).toContain("budget_vs_actual");
  });

  it("supports consolidated multi-entity reporting", () => {
    const { finance, entity, accounts } = boot("org.cons");
    const sub = finance.createEntity({
      organizationId: "org.cons",
      userId: "u-cfo",
      name: "Campus B",
      kind: "campus",
      parentEntityId: entity.id,
    });
    expect("error" in sub).toBe(false);
    if ("error" in sub) return;
    postSale(finance, "org.cons", accounts, entity.id, 300, "2026-08");
    postSale(finance, "org.cons", accounts, sub.id, 200, "2026-08");
    const reporting = createFinancialReportingEngine();
    const cons = reporting.generateStatement({
      organizationId: "org.cons",
      userId: "u-cfo",
      kind: "income_statement",
      periodKey: "2026-08",
      scope: "consolidated",
    });
    expect(cons.totals.revenue).toBe(500);
    const entityOnly = reporting.generateStatement({
      organizationId: "org.cons",
      userId: "u-cfo",
      kind: "income_statement",
      periodKey: "2026-08",
      scope: "entity",
      scopeId: entity.id,
    });
    expect(entityOnly.totals.revenue).toBe(300);
  });
});
