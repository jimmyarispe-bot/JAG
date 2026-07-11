/**
 * Sprint 020 — Accounting Intelligence Engine
 * Comprehensive unit tests.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  createAccountingIntelligence,
  ACCOUNTING_INTELLIGENCE_VERSION,
  ACCOUNTING_JOURNAL_TYPES,
  ACCOUNTING_PERIOD_STATUSES,
  ACCOUNTING_ALLOCATION_BASES,
  ACCOUNTING_NET_ASSET_CLASSES,
} from "@/lib/platform/accounting";
import type { AccountingEngine } from "@/lib/platform/accounting";
import { emptyDimensions } from "@/lib/platform/finance/types";
import type { FinanceDimensionalContext } from "@/lib/platform/finance/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let _id = 0;
function testId(prefix: string): string {
  _id += 1;
  return `${prefix}-${_id}`;
}

const testNow = (): Date => new Date("2025-06-15T00:00:00Z");

const dims: FinanceDimensionalContext = emptyDimensions({
  organizationId: "org-1",
  schoolId: "school-1",
  campusId: "campus-1",
  departmentId: "dept-1",
});

function makeEngine(): AccountingEngine {
  return createAccountingIntelligence({
    createId: testId,
    now: testNow,
  });
}

function setupPeriod(engine: AccountingEngine) {
  const calendar = engine.periods.createCalendar({
    name: "FY2025",
    kind: "custom_fiscal_year",
    fiscalYearStartMonth: 7,
  });
  const period = engine.periods.createPeriod({
    calendarId: calendar.id,
    name: "June 2025",
    fiscalYear: 2025,
    frequency: "monthly",
    periodNumber: 12,
    startDate: "2025-06-01",
    endDate: "2025-06-30",
  });
  return { calendar, period };
}

function accounts(engine: AccountingEngine) {
  const coa = engine.finance.coa;
  return {
    cash: coa.findByCode("1000")!,
    ar: coa.findByCode("1100")!,
    prepaid: coa.findByCode("1200")!,
    ap: coa.findByCode("2000")!,
    accrued: coa.findByCode("2100")!,
    deferred: coa.findByCode("2200")!,
    re: coa.findByCode("3000")!,
    tuition: coa.findByCode("4000")!,
    grantRev: coa.findByCode("4100")!,
    payroll: coa.findByCode("5000")!,
    admin: coa.findByCode("5300")!,
    interest: coa.findByCode("5700")!,
  };
}

// ---------------------------------------------------------------------------
// Version
// ---------------------------------------------------------------------------

describe("ACCOUNTING_INTELLIGENCE_VERSION", () => {
  it("should be 0.1.0", () => {
    expect(ACCOUNTING_INTELLIGENCE_VERSION).toBe("0.1.0");
  });
});

describe("constants", () => {
  it("exposes journal types", () => {
    expect(ACCOUNTING_JOURNAL_TYPES).toContain("general");
    expect(ACCOUNTING_JOURNAL_TYPES).toContain("intercompany");
    expect(ACCOUNTING_JOURNAL_TYPES).toHaveLength(12);
  });

  it("exposes period statuses", () => {
    expect(ACCOUNTING_PERIOD_STATUSES).toContain("open");
    expect(ACCOUNTING_PERIOD_STATUSES).toContain("locked");
    expect(ACCOUNTING_PERIOD_STATUSES).toContain("reopened");
  });

  it("exposes allocation bases and net asset classes", () => {
    expect(ACCOUNTING_ALLOCATION_BASES).toContain("enrollment");
    expect(ACCOUNTING_NET_ASSET_CLASSES).toContain("permanently_restricted");
  });
});

// ---------------------------------------------------------------------------
// Engine composition
// ---------------------------------------------------------------------------

describe("AccountingEngine", () => {
  beforeEach(() => {
    _id = 0;
  });

  it("composes FinanceEngine without replacing it", () => {
    const engine = makeEngine();
    expect(engine.finance).toBeDefined();
    expect(engine.finance.gl).toBeDefined();
    expect(engine.finance.coa.listAccounts().length).toBeGreaterThan(0);
  });

  it("exposes all accounting modules", () => {
    const engine = makeEngine();
    expect(engine.periods).toBeDefined();
    expect(engine.posting).toBeDefined();
    expect(engine.journals).toBeDefined();
    expect(engine.accruals).toBeDefined();
    expect(engine.deferrals).toBeDefined();
    expect(engine.allocations).toBeDefined();
    expect(engine.reclassifications).toBeDefined();
    expect(engine.adjustments).toBeDefined();
    expect(engine.eliminations).toBeDefined();
    expect(engine.retainedEarnings).toBeDefined();
    expect(engine.consolidation).toBeDefined();
    expect(engine.close).toBeDefined();
    expect(engine.financialStatements).toBeDefined();
    expect(engine.disclosures).toBeDefined();
    expect(engine.nonprofit).toBeDefined();
    expect(engine.controls).toBeDefined();
    expect(engine.gaap).toBeDefined();
    expect(engine.audit).toBeDefined();
    expect(engine.reconciliation).toBeDefined();
    expect(engine.reporting).toBeDefined();
    expect(engine.exports).toBeDefined();
  });

  it("runCycle produces finance/executive/integration outputs", () => {
    const engine = makeEngine();
    const result = engine.runCycle();
    expect(result.cycleId).toBeDefined();
    expect(result.modulesProcessed.length).toBeGreaterThan(15);
    expect(result.factsForFinance.trialBalanceBalanced).toBe(true);
    expect(result.factsForExecutive).toBeDefined();
    expect(result.integration.auditEventCount).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Periods
// ---------------------------------------------------------------------------

describe("AccountingPeriods", () => {
  let engine: AccountingEngine;

  beforeEach(() => {
    _id = 0;
    engine = makeEngine();
  });

  it("creates calendar year and custom fiscal calendars", () => {
    const cal = engine.periods.createCalendar({
      name: "Calendar",
      kind: "calendar_year",
    });
    expect(cal.fiscalYearStartMonth).toBe(1);

    const fy = engine.periods.createCalendar({
      name: "FY",
      kind: "custom_fiscal_year",
      fiscalYearStartMonth: 7,
    });
    expect(fy.fiscalYearStartMonth).toBe(7);
  });

  it("supports monthly, quarterly, annual periods", () => {
    const { calendar } = setupPeriod(engine);
    const q = engine.periods.createPeriod({
      calendarId: calendar.id,
      name: "Q4",
      fiscalYear: 2025,
      frequency: "quarterly",
      periodNumber: 4,
      startDate: "2025-04-01",
      endDate: "2025-06-30",
    });
    const annual = engine.periods.createPeriod({
      calendarId: calendar.id,
      name: "FY2025",
      fiscalYear: 2025,
      frequency: "annual",
      periodNumber: 1,
      startDate: "2024-07-01",
      endDate: "2025-06-30",
    });
    expect(q.frequency).toBe("quarterly");
    expect(annual.frequency).toBe("annual");
  });

  it("transitions open → soft_close → hard_close → locked", () => {
    const { period } = setupPeriod(engine);
    expect(period.status).toBe("open");
    expect(engine.periods.softClose(period.id).status).toBe("soft_close");
    expect(engine.periods.hardClose(period.id).status).toBe("hard_close");
    expect(engine.periods.lock(period.id).status).toBe("locked");
  });

  it("reopens only with approval", () => {
    const { period } = setupPeriod(engine);
    engine.periods.lock(period.id);
    expect(() => engine.periods.reopen(period.id, "")).toThrow(/approval/i);
    const reopened = engine.periods.reopen(period.id, "appr-1", "controller");
    expect(reopened.status).toBe("reopened");
    expect(reopened.reopenedApprovalId).toBe("appr-1");
  });

  it("canPost respects period locks", () => {
    const { period } = setupPeriod(engine);
    expect(engine.periods.canPost(period.id)).toBe(true);
    engine.periods.softClose(period.id);
    expect(engine.periods.canPost(period.id)).toBe(true);
    engine.periods.hardClose(period.id);
    expect(engine.periods.canPost(period.id)).toBe(false);
    expect(
      engine.periods.canPost(period.id, { allowHardCloseAdjustment: true })
    ).toBe(true);
    engine.periods.lock(period.id);
    expect(engine.periods.canPost(period.id)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// GAAP / balanced journals
// ---------------------------------------------------------------------------

describe("AccountingGaap", () => {
  let engine: AccountingEngine;

  beforeEach(() => {
    _id = 0;
    engine = makeEngine();
  });

  it("rejects unbalanced journals", () => {
    const result = engine.gaap.validateBalancedLines([
      { debit: 100, credit: 0 },
      { debit: 0, credit: 50 },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/does not balance/);
  });

  it("accepts balanced journals", () => {
    const result = engine.gaap.validateBalancedLines([
      { debit: 100, credit: 0 },
      { debit: 0, credit: 100 },
    ]);
    expect(result.valid).toBe(true);
  });

  it("rejects both debit and credit on same line", () => {
    const result = engine.gaap.validateBalancedLines([
      { debit: 50, credit: 50 },
      { debit: 0, credit: 0 },
    ]);
    expect(result.valid).toBe(false);
  });

  it("requires organizationId by default", () => {
    const result = engine.gaap.validateDimensions(emptyDimensions());
    expect(result.valid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Posting engine
// ---------------------------------------------------------------------------

describe("AccountingPosting", () => {
  let engine: AccountingEngine;
  let periodId: string;
  let acct: ReturnType<typeof accounts>;

  beforeEach(() => {
    _id = 0;
    engine = makeEngine();
    periodId = setupPeriod(engine).period.id;
    acct = accounts(engine);
  });

  it("drafts and posts a balanced journal into Finance GL", () => {
    const draft = engine.posting.draftJournal({
      journalType: "general",
      periodId,
      memo: "Tuition cash receipt",
      dimensions: dims,
      lines: [
        { accountId: acct.cash.id, debit: 1000, credit: 0 },
        { accountId: acct.tuition.id, debit: 0, credit: 1000 },
      ],
    });
    expect(draft.status).toBe("draft");

    const posted = engine.posting.postJournal(draft.id, { actorId: "cfo" });
    expect(posted.status).toBe("posted");
    expect(posted.financeJournalId).toBeTruthy();
    expect(posted.postedAt).toBe("2025-06-15T00:00:00.000Z");

    const glEntry = engine.finance.gl.getJournal(posted.financeJournalId!);
    expect(glEntry?.status).toBe("posted");
    expect(engine.finance.gl.getBalance(acct.cash.id).normalBalance).toBe(1000);
  });

  it("rejects unbalanced draft", () => {
    expect(() =>
      engine.posting.draftJournal({
        journalType: "general",
        periodId,
        memo: "bad",
        dimensions: dims,
        lines: [
          { accountId: acct.cash.id, debit: 100, credit: 0 },
          { accountId: acct.tuition.id, debit: 0, credit: 50 },
        ],
      })
    ).toThrow(/balance/i);
  });

  it("reverses without deleting original", () => {
    const draft = engine.posting.draftJournal({
      journalType: "general",
      periodId,
      memo: "to reverse",
      dimensions: dims,
      lines: [
        { accountId: acct.cash.id, debit: 200, credit: 0 },
        { accountId: acct.tuition.id, debit: 0, credit: 200 },
      ],
    });
    const posted = engine.posting.postJournal(draft.id);
    const reversal = engine.posting.reverseJournal(posted.id, "Correction");

    expect(reversal.reversesId).toBe(posted.id);
    expect(engine.posting.getJournal(posted.id)?.status).toBe("reversed");
    expect(engine.posting.getJournal(posted.id)).toBeDefined();
    expect(engine.finance.gl.getBalance(acct.cash.id).normalBalance).toBe(0);
  });

  it("prevents posting into locked periods", () => {
    engine.periods.lock(periodId);
    const draft = engine.posting.draftJournal({
      journalType: "general",
      periodId,
      memo: "locked attempt",
      dimensions: dims,
      lines: [
        { accountId: acct.cash.id, debit: 10, credit: 0 },
        { accountId: acct.tuition.id, debit: 0, credit: 10 },
      ],
    });
    expect(() => engine.posting.postJournal(draft.id)).toThrow(/locked/i);
  });

  it("prevents duplicate fingerprints", () => {
    const lines = [
      { accountId: acct.cash.id, debit: 75, credit: 0 },
      { accountId: acct.tuition.id, debit: 0, credit: 75 },
    ];
    const a = engine.posting.draftJournal({
      journalType: "general",
      periodId,
      memo: "dup",
      dimensions: dims,
      lines,
    });
    engine.posting.postJournal(a.id);
    const b = engine.posting.draftJournal({
      journalType: "general",
      periodId,
      memo: "dup",
      dimensions: dims,
      lines,
    });
    expect(() => engine.posting.postJournal(b.id)).toThrow(/Duplicate/i);
  });

  it("supports recurring and scheduled posting", () => {
    engine.posting.createRecurring({
      name: "Monthly rent",
      journalType: "general",
      memo: "Rent accrual",
      dimensions: dims,
      intervalDays: 30,
      nextPostDate: "2025-06-01",
      lines: [
        { accountId: acct.admin.id, debit: 500, credit: 0 },
        { accountId: acct.accrued.id, debit: 0, credit: 500 },
      ],
    });
    const posted = engine.posting.postRecurringDue(periodId, "2025-06-15");
    expect(posted.length).toBe(1);

    const draft = engine.posting.draftJournal({
      journalType: "cash",
      periodId,
      memo: "scheduled",
      dimensions: dims,
      lines: [
        { accountId: acct.cash.id, debit: 25, credit: 0 },
        { accountId: acct.tuition.id, debit: 0, credit: 25 },
      ],
    });
    engine.posting.schedulePosting(draft.id, "2025-06-10");
    const ran = engine.posting.runScheduled("2025-06-15");
    expect(ran[0].status).toBe("posted");
  });

  it("batch posts multiple drafts", () => {
    const ids = [1, 2].map((n) =>
      engine.posting.draftJournal({
        journalType: "general",
        periodId,
        memo: `batch ${n}`,
        dimensions: dims,
        lines: [
          { accountId: acct.cash.id, debit: n * 10, credit: 0 },
          { accountId: acct.tuition.id, debit: 0, credit: n * 10 },
        ],
      }).id
    );
    const results = engine.posting.batchPost(ids);
    expect(results).toHaveLength(2);
    expect(results.every((j) => j.status === "posted")).toBe(true);
  });

  it("keeps immutable posting history", () => {
    const draft = engine.posting.draftJournal({
      journalType: "general",
      periodId,
      memo: "history",
      dimensions: dims,
      lines: [
        { accountId: acct.cash.id, debit: 5, credit: 0 },
        { accountId: acct.tuition.id, debit: 0, credit: 5 },
      ],
    });
    engine.posting.postJournal(draft.id);
    const history = engine.posting.getPostingHistory();
    expect(history).toHaveLength(1);
    expect(Object.isFrozen(history)).toBe(false);
    expect(history[0].status).toBe("posted");
  });
});

// ---------------------------------------------------------------------------
// Journal types
// ---------------------------------------------------------------------------

describe("AccountingJournals", () => {
  let engine: AccountingEngine;
  let periodId: string;
  let acct: ReturnType<typeof accounts>;

  beforeEach(() => {
    _id = 0;
    engine = makeEngine();
    periodId = setupPeriod(engine).period.id;
    acct = accounts(engine);
  });

  it("lists all 12 journal types", () => {
    expect(engine.journals.listTypes()).toHaveLength(12);
  });

  it("requires reason for reclassification", () => {
    expect(() =>
      engine.journals.draftReclassification({
        periodId,
        memo: "reclass",
        dimensions: dims,
        lines: [
          { accountId: acct.admin.id, debit: 10, credit: 0 },
          { accountId: acct.payroll.id, debit: 0, credit: 10 },
        ],
      })
    ).toThrow(/Reason/i);
  });

  it("drafts typed journals", () => {
    const payroll = engine.journals.draftPayroll({
      periodId,
      memo: "Payroll",
      dimensions: dims,
      lines: [
        { accountId: acct.payroll.id, debit: 100, credit: 0 },
        { accountId: acct.accrued.id, debit: 0, credit: 100 },
      ],
    });
    expect(payroll.journalType).toBe("payroll");
  });
});

// ---------------------------------------------------------------------------
// Accruals
// ---------------------------------------------------------------------------

describe("AccountingAccruals", () => {
  let engine: AccountingEngine;
  let periodId: string;
  let acct: ReturnType<typeof accounts>;

  beforeEach(() => {
    _id = 0;
    engine = makeEngine();
    periodId = setupPeriod(engine).period.id;
    acct = accounts(engine);
  });

  it("posts revenue/expense/interest/payroll/grant accruals", () => {
    const kinds = [
      "revenue",
      "expense",
      "interest",
      "payroll",
      "grant",
    ] as const;
    for (const kind of kinds) {
      const accrual = engine.accruals.create({
        kind,
        description: `${kind} accrual`,
        amount: 100,
        debitAccountId: kind === "revenue" ? acct.ar.id : acct.payroll.id,
        creditAccountId:
          kind === "revenue" ? acct.tuition.id : acct.accrued.id,
        periodId,
        dimensions: dims,
        autoReverse: true,
      });
      expect(accrual.journalId).toBeTruthy();
      expect(accrual.autoReverse).toBe(true);
    }
    expect(engine.accruals.list()).toHaveLength(5);
  });

  it("auto-reverses accruals", () => {
    const accrual = engine.accruals.create({
      kind: "expense",
      description: "Utilities",
      amount: 250,
      debitAccountId: acct.admin.id,
      creditAccountId: acct.accrued.id,
      periodId,
      dimensions: dims,
    });
    const reversed = engine.accruals.autoReverseDue(periodId);
    expect(reversed).toHaveLength(1);
    expect(engine.accruals.get(accrual.id)?.reversed).toBe(true);
    expect(engine.accruals.get(accrual.id)?.reversalJournalId).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Deferrals
// ---------------------------------------------------------------------------

describe("AccountingDeferrals", () => {
  let engine: AccountingEngine;
  let periodId: string;
  let acct: ReturnType<typeof accounts>;
  let calendarId: string;

  beforeEach(() => {
    _id = 0;
    engine = makeEngine();
    const setup = setupPeriod(engine);
    periodId = setup.period.id;
    calendarId = setup.calendar.id;
    acct = accounts(engine);
  });

  it("creates revenue deferral with schedule and remaining balance", () => {
    const p2 = engine.periods.createPeriod({
      calendarId,
      name: "July 2025",
      fiscalYear: 2026,
      frequency: "monthly",
      periodNumber: 1,
      startDate: "2025-07-01",
      endDate: "2025-07-31",
    });

    const deferral = engine.deferrals.create({
      kind: "revenue",
      description: "Annual tuition prepaid",
      totalAmount: 1200,
      deferralAccountId: acct.deferred.id,
      recognitionAccountId: acct.tuition.id,
      offsetAccountId: acct.cash.id,
      setupPeriodId: periodId,
      schedulePeriodIds: [periodId, p2.id],
      scheduleAmounts: [600, 600],
      dimensions: dims,
    });
    expect(deferral.remainingBalance).toBe(1200);

    const recognized = engine.deferrals.recognize(deferral.id, periodId);
    expect(recognized.remainingBalance).toBe(600);
    expect(recognized.schedule[0].recognized).toBe(true);
  });

  it("creates expense deferral", () => {
    const deferral = engine.deferrals.create({
      kind: "expense",
      description: "Prepaid insurance",
      totalAmount: 300,
      deferralAccountId: acct.prepaid.id,
      recognitionAccountId: acct.admin.id,
      offsetAccountId: acct.cash.id,
      setupPeriodId: periodId,
      schedulePeriodIds: [periodId],
      dimensions: dims,
    });
    expect(deferral.kind).toBe("expense");
    engine.deferrals.recognize(deferral.id, periodId);
    expect(engine.deferrals.get(deferral.id)?.remainingBalance).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Allocations
// ---------------------------------------------------------------------------

describe("AccountingAllocations", () => {
  let engine: AccountingEngine;
  let periodId: string;
  let acct: ReturnType<typeof accounts>;

  beforeEach(() => {
    _id = 0;
    engine = makeEngine();
    periodId = setupPeriod(engine).period.id;
    acct = accounts(engine);
  });

  it("allocates by department weights", () => {
    const allocation = engine.allocations.create({
      name: "Facilities overhead",
      base: "department",
      sourceAccountId: acct.admin.id,
      destinationAccountId: acct.payroll.id,
      amount: 1000,
      periodId,
      dimensions: dims,
      targets: [
        { targetId: "dept-a", label: "Dept A", weight: 60 },
        { targetId: "dept-b", label: "Dept B", weight: 40 },
      ],
    });
    expect(allocation.journalId).toBeTruthy();
    expect(allocation.targets).toHaveLength(2);
  });

  it("supports custom allocation bases", () => {
    for (const base of [
      "campus",
      "program",
      "grant",
      "enrollment",
      "custom",
    ] as const) {
      const a = engine.allocations.create({
        name: `Alloc ${base}`,
        base,
        sourceAccountId: acct.admin.id,
        destinationAccountId: acct.payroll.id,
        amount: 100,
        periodId,
        dimensions: dims,
        targets: [
          { targetId: "t1", label: "T1", weight: 1 },
          { targetId: "t2", label: "T2", weight: 1 },
        ],
      });
      expect(a.base).toBe(base);
    }
  });
});

// ---------------------------------------------------------------------------
// Reclassifications & Adjustments
// ---------------------------------------------------------------------------

describe("Reclassifications and Adjustments", () => {
  let engine: AccountingEngine;
  let periodId: string;
  let acct: ReturnType<typeof accounts>;

  beforeEach(() => {
    _id = 0;
    engine = makeEngine();
    periodId = setupPeriod(engine).period.id;
    acct = accounts(engine);
  });

  it("requires reason for reclassification and records audit", () => {
    expect(() =>
      engine.reclassifications.create({
        scope: "account",
        reason: "   ",
        amount: 50,
        fromAccountId: acct.admin.id,
        toAccountId: acct.payroll.id,
        periodId,
      })
    ).toThrow(/Reason/i);

    const item = engine.reclassifications.create({
      scope: "department",
      reason: "Move cost to instruction",
      amount: 50,
      fromAccountId: acct.admin.id,
      toAccountId: acct.payroll.id,
      periodId,
      fromDimensions: dims,
      toDimensions: dims,
      createdBy: "controller",
    });
    expect(item.journalId).toBeTruthy();
    expect(
      engine.audit.listByKind("reclassification").length
    ).toBeGreaterThan(0);
  });

  it("creates adjustments with reason", () => {
    const adj = engine.adjustments.create({
      description: "Correct coding",
      reason: "Misposted invoice",
      amount: 40,
      debitAccountId: acct.admin.id,
      creditAccountId: acct.ap.id,
      periodId,
      dimensions: dims,
    });
    expect(adj.journalId).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Closing
// ---------------------------------------------------------------------------

describe("AccountingClose", () => {
  let engine: AccountingEngine;
  let periodId: string;
  let acct: ReturnType<typeof accounts>;

  beforeEach(() => {
    _id = 0;
    engine = makeEngine();
    periodId = setupPeriod(engine).period.id;
    acct = accounts(engine);
  });

  it("blocks close when reconciliations missing after refresh", () => {
    // Seed a recon that is not reconciled
    engine.posting.draftJournal({
      journalType: "general",
      periodId,
      memo: "cash seed",
      dimensions: dims,
      lines: [
        { accountId: acct.cash.id, debit: 100, credit: 0 },
        { accountId: acct.tuition.id, debit: 0, credit: 100 },
      ],
    });
    // leave draft unposted
    const process = engine.close.start({ kind: "month", periodId });
    expect(process.status).toBe("blocked");
    expect(process.unpostedJournalIds.length).toBe(1);
  });

  it("completes month close after checklist", () => {
    const process = engine.close.start({ kind: "month", periodId });
    expect(process.status).toBe("in_progress");

    for (const item of process.checklist.filter((c) => c.required)) {
      engine.close.completeChecklistItem(process.id, item.id, "controller");
    }
    engine.close.submitForApproval(process.id, "appr-close-1");
    const done = engine.close.complete(process.id, "controller");
    expect(done.status).toBe("completed");
    expect(engine.periods.getPeriod(periodId)?.status).toBe("soft_close");
  });

  it("year-end close requires board signoff", () => {
    const process = engine.close.start({ kind: "year_end", periodId });
    for (const item of process.checklist.filter((c) => c.required)) {
      engine.close.completeChecklistItem(process.id, item.id, "cfo");
    }
    expect(() => engine.close.complete(process.id)).toThrow(/board/i);
    engine.close.requestBoardSignoff(process.id, "board-1");
    const done = engine.close.complete(process.id, "cfo");
    expect(done.status).toBe("completed");
    expect(engine.periods.getPeriod(periodId)?.status).toBe("year_end");
  });
});

// ---------------------------------------------------------------------------
// Financial statements
// ---------------------------------------------------------------------------

describe("AccountingFinancialStatements", () => {
  let engine: AccountingEngine;
  let periodId: string;
  let acct: ReturnType<typeof accounts>;

  beforeEach(() => {
    _id = 0;
    engine = makeEngine();
    periodId = setupPeriod(engine).period.id;
    acct = accounts(engine);

    const draft = engine.posting.draftJournal({
      journalType: "general",
      periodId,
      memo: "seed",
      dimensions: dims,
      lines: [
        { accountId: acct.cash.id, debit: 5000, credit: 0 },
        { accountId: acct.tuition.id, debit: 0, credit: 5000 },
      ],
    });
    engine.posting.postJournal(draft.id, { skipDuplicateCheck: true });

    const exp = engine.posting.draftJournal({
      journalType: "general",
      periodId,
      memo: "expense seed",
      dimensions: dims,
      lines: [
        { accountId: acct.admin.id, debit: 1000, credit: 0 },
        { accountId: acct.cash.id, debit: 0, credit: 1000 },
      ],
    });
    engine.posting.postJournal(exp.id, { skipDuplicateCheck: true });
  });

  it("generates core statement kinds", () => {
    const kinds = [
      "balance_sheet",
      "income_statement",
      "statement_of_activities",
      "statement_of_cash_flows",
      "statement_of_functional_expenses",
      "trial_balance",
      "comparative",
      "budget_vs_actual",
      "department",
      "campus",
      "grant",
      "scholarship",
    ] as const;

    for (const kind of kinds) {
      const stmt = engine.financialStatements.generate({ kind, periodId });
      expect(stmt.kind).toBe(kind);
      expect(stmt.lines.length).toBeGreaterThanOrEqual(0);
    }
  });

  it("income statement includes net income", () => {
    const stmt = engine.financialStatements.generate({
      kind: "income_statement",
      periodId,
    });
    expect(stmt.totals.netIncome).toBe(4000);
  });
});

// ---------------------------------------------------------------------------
// Audit trail
// ---------------------------------------------------------------------------

describe("AccountingAudit", () => {
  let engine: AccountingEngine;

  beforeEach(() => {
    _id = 0;
    engine = makeEngine();
  });

  it("never deletes events", () => {
    engine.audit.record({
      kind: "journal",
      entityId: "j1",
      entityType: "AccountingJournal",
      action: "draft",
      actorId: "u1",
      reason: "test",
      approvalRef: "a1",
      evidenceRef: "e1",
      sourceTransactionId: "src-1",
      workflowRef: "wf-1",
      recommendationRef: "rec-1",
      governanceDecisionRef: "gov-1",
      dimensions: dims,
    });
    expect(engine.audit.count()).toBe(1);
    expect(() => engine.audit.delete("x")).toThrow(/cannot be deleted/i);
    expect(engine.audit.count()).toBe(1);
  });

  it("records who/when/why/links on posting", () => {
    const { period } = setupPeriod(engine);
    const acct = accounts(engine);
    const draft = engine.posting.draftJournal({
      journalType: "general",
      periodId: period.id,
      memo: "audited",
      dimensions: dims,
      reason: "month-end",
      evidenceRef: "ev-9",
      approvalRef: "ap-9",
      workflowRef: "wf-9",
      recommendationRef: "rec-9",
      governanceDecisionRef: "gov-9",
      sourceTransactionId: "txn-9",
      createdBy: "prep-1",
      lines: [
        { accountId: acct.cash.id, debit: 1, credit: 0 },
        { accountId: acct.tuition.id, debit: 0, credit: 1 },
      ],
    });
    engine.posting.postJournal(draft.id, { actorId: "poster-1" });
    const events = engine.audit.listByEntity(draft.id);
    expect(events.some((e) => e.action === "draft")).toBe(true);
    expect(events.some((e) => e.action === "post")).toBe(true);
    const post = events.find((e) => e.action === "post")!;
    expect(post.actorId).toBe("poster-1");
    expect(post.reason).toBe("month-end");
    expect(post.evidenceRef).toBe("ev-9");
    expect(post.workflowRef).toBe("wf-9");
  });
});

// ---------------------------------------------------------------------------
// GAAP controls / separation of duties
// ---------------------------------------------------------------------------

describe("AccountingControls", () => {
  let engine: AccountingEngine;

  beforeEach(() => {
    _id = 0;
    engine = makeEngine();
  });

  it("enforces posting permissions", () => {
    engine.controls.grantPermission({
      actorId: "clerk",
      canDraft: true,
      canPost: false,
    });
    const { period } = setupPeriod(engine);
    const acct = accounts(engine);
    const draft = engine.posting.draftJournal({
      journalType: "general",
      periodId: period.id,
      memo: "perm",
      dimensions: dims,
      createdBy: "clerk",
      lines: [
        { accountId: acct.cash.id, debit: 1, credit: 0 },
        { accountId: acct.tuition.id, debit: 0, credit: 1 },
      ],
    });
    expect(() =>
      engine.posting.postJournal(draft.id, { actorId: "clerk" })
    ).toThrow(/post permission/i);
  });

  it("enforces separation of duties on approve", () => {
    const { period } = setupPeriod(engine);
    const acct = accounts(engine);
    const draft = engine.posting.draftJournal({
      journalType: "general",
      periodId: period.id,
      memo: "sod",
      dimensions: dims,
      createdBy: "prep-1",
      lines: [
        { accountId: acct.cash.id, debit: 2, credit: 0 },
        { accountId: acct.tuition.id, debit: 0, credit: 2 },
      ],
    });
    expect(() =>
      engine.posting.approveJournal(draft.id, "appr-1", "prep-1")
    ).toThrow(/Separation of duties/i);

    const approved = engine.posting.approveJournal(
      draft.id,
      "appr-1",
      "approver-1"
    );
    expect(approved.status).toBe("approved");
  });
});

// ---------------------------------------------------------------------------
// Nonprofit / retained earnings / consolidation / exports
// ---------------------------------------------------------------------------

describe("Nonprofit, RE, consolidation, exports", () => {
  let engine: AccountingEngine;
  let periodId: string;
  let acct: ReturnType<typeof accounts>;

  beforeEach(() => {
    _id = 0;
    engine = makeEngine();
    periodId = setupPeriod(engine).period.id;
    acct = accounts(engine);
  });

  it("tracks net asset classes and funds", () => {
    engine.nonprofit.createFund({
      name: "General",
      netAssetClass: "unrestricted",
      openingBalance: 10000,
    });
    engine.nonprofit.createFund({
      name: "Scholarship endowment",
      netAssetClass: "permanently_restricted",
      donorRestriction: "Corpus must be maintained",
      openingBalance: 50000,
    });
    const byClass = engine.nonprofit.netAssetsByClass();
    expect(byClass.unrestricted).toBe(10000);
    expect(byClass.permanently_restricted).toBe(50000);
  });

  it("closes to retained earnings", () => {
    engine.posting.postJournal(
      engine.posting.draftJournal({
        journalType: "general",
        periodId,
        memo: "rev",
        dimensions: dims,
        lines: [
          { accountId: acct.cash.id, debit: 800, credit: 0 },
          { accountId: acct.tuition.id, debit: 0, credit: 800 },
        ],
      }).id,
      { skipDuplicateCheck: true }
    );
    engine.posting.postJournal(
      engine.posting.draftJournal({
        journalType: "general",
        periodId,
        memo: "exp",
        dimensions: dims,
        lines: [
          { accountId: acct.admin.id, debit: 300, credit: 0 },
          { accountId: acct.cash.id, debit: 0, credit: 300 },
        ],
      }).id,
      { skipDuplicateCheck: true }
    );

    const entry = engine.retainedEarnings.closeYear({
      fiscalYear: 2025,
      periodId,
      retainedEarningsAccountId: acct.re.id,
      organizationId: "org-1",
    });
    expect(entry.netIncome).toBe(500);
    expect(entry.closingJournalId).toBeTruthy();
  });

  it("consolidates entities with eliminations", () => {
    engine.consolidation.addEntity({ name: "Parent" });
    engine.consolidation.addEntity({
      name: "Subsidiary",
      ownershipPercent: 100,
    });
    engine.eliminations.create({
      description: "Intercompany receivable",
      amount: 100,
      debitAccountId: acct.ap.id,
      creditAccountId: acct.ar.id,
      entityFromId: "parent",
      entityToId: "sub",
      periodId,
    });
    const result = engine.consolidation.consolidate(periodId);
    expect(result.entityIds.length).toBe(2);
    expect(result.eliminationIds.length).toBe(1);
  });

  it("exports period packages", () => {
    engine.posting.postJournal(
      engine.posting.draftJournal({
        journalType: "general",
        periodId,
        memo: "export me",
        dimensions: dims,
        lines: [
          { accountId: acct.cash.id, debit: 10, credit: 0 },
          { accountId: acct.tuition.id, debit: 0, credit: 10 },
        ],
      }).id,
      { skipDuplicateCheck: true }
    );
    engine.financialStatements.generate({
      kind: "trial_balance",
      periodId,
    });
    const pkg = engine.exports.exportPeriod(periodId, "csv_summary");
    expect(pkg.journalCount).toBe(1);
    expect(pkg.statementCount).toBe(1);
    expect(pkg.payload.csvSummary).toContain("export me");
  });

  it("builds reporting package and disclosures", () => {
    const stmt = engine.financialStatements.generate({
      kind: "balance_sheet",
      periodId,
    });
    engine.disclosures.add({
      title: "Basis of accounting",
      body: "Accrual basis under US GAAP",
      periodId,
      required: true,
    });
    const report = engine.reporting.buildPackage({
      title: "June package",
      periodId,
      statementIds: [stmt.id],
    });
    expect(report.statementIds).toEqual([stmt.id]);
    expect(engine.disclosures.listRequired(periodId)).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Reconciliation
// ---------------------------------------------------------------------------

describe("AccountingReconciliation", () => {
  let engine: AccountingEngine;
  let periodId: string;
  let acct: ReturnType<typeof accounts>;

  beforeEach(() => {
    _id = 0;
    engine = makeEngine();
    periodId = setupPeriod(engine).period.id;
    acct = accounts(engine);
  });

  it("reconciles matching balances", () => {
    engine.posting.postJournal(
      engine.posting.draftJournal({
        journalType: "general",
        periodId,
        memo: "cash",
        dimensions: dims,
        lines: [
          { accountId: acct.cash.id, debit: 250, credit: 0 },
          { accountId: acct.tuition.id, debit: 0, credit: 250 },
        ],
      }).id,
      { skipDuplicateCheck: true }
    );
    const recon = engine.reconciliation.start({
      accountId: acct.cash.id,
      periodId,
      externalBalance: 250,
    });
    expect(recon.status).toBe("reconciled");
    expect(recon.difference).toBe(0);
  });

  it("flags exceptions on mismatch", () => {
    const recon = engine.reconciliation.start({
      accountId: acct.cash.id,
      periodId,
      externalBalance: 99,
    });
    expect(recon.status).toBe("in_progress");
    const flagged = engine.reconciliation.flagException(
      recon.id,
      "Unidentified deposit"
    );
    expect(flagged.status).toBe("exception");
  });
});
