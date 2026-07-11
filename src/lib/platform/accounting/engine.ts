/**
 * Accounting Intelligence Engine — Façade.
 *
 * Sprint 020 | ACCOUNTING_INTELLIGENCE_VERSION = "0.1.0"
 *
 * Composes the existing Finance Engine via dependency injection.
 * Does NOT replace or duplicate Finance business logic.
 *
 * Architecture:
 *   Accounting records facts.
 *   Finance analyzes facts.
 *   Executive Intelligence interprets facts.
 *   JAG decides what to do.
 */

import { AccountingAccruals } from "@/lib/platform/accounting/accruals";
import { AccountingAdjustments } from "@/lib/platform/accounting/adjustments";
import { AccountingAllocations } from "@/lib/platform/accounting/allocations";
import { AccountingAudit } from "@/lib/platform/accounting/audit";
import { AccountingClose } from "@/lib/platform/accounting/close";
import { AccountingConsolidation } from "@/lib/platform/accounting/consolidation";
import { AccountingControls } from "@/lib/platform/accounting/controls";
import { AccountingDeferrals } from "@/lib/platform/accounting/deferrals";
import { AccountingDisclosures } from "@/lib/platform/accounting/disclosures";
import { AccountingEliminations } from "@/lib/platform/accounting/eliminations";
import { AccountingExports } from "@/lib/platform/accounting/exports";
import { AccountingFinancialStatements } from "@/lib/platform/accounting/financial-statements";
import { AccountingGaap } from "@/lib/platform/accounting/gaap";
import { AccountingJournals } from "@/lib/platform/accounting/journals";
import { AccountingNonprofit } from "@/lib/platform/accounting/nonprofit";
import { AccountingPeriods } from "@/lib/platform/accounting/periods";
import { AccountingPosting } from "@/lib/platform/accounting/posting";
import { AccountingReclassifications } from "@/lib/platform/accounting/reclassifications";
import { AccountingReconciliationService } from "@/lib/platform/accounting/reconciliation";
import { AccountingReporting } from "@/lib/platform/accounting/reporting";
import { AccountingRetainedEarnings } from "@/lib/platform/accounting/retained-earnings";
import { createAccountingId } from "@/lib/platform/accounting/ids";
import type {
  AccountingEngineCycleResult,
  AccountingFactsForExecutive,
  AccountingFactsForFinance,
  AccountingIntegrationLinks,
} from "@/lib/platform/accounting/types";
import {
  createEnterpriseFinance,
  type FinanceEngine,
  type FinanceEngineDependencies,
} from "@/lib/platform/finance/engine";

export interface AccountingEngineDependencies {
  /** Inject an existing FinanceEngine, or one will be created. */
  finance?: FinanceEngine;
  /** Passed to createEnterpriseFinance when finance is not injected. */
  financeDeps?: FinanceEngineDependencies;
  createId?: (prefix: string) => string;
  now?: () => Date;
  requireEvidenceOnPost?: boolean;
  requireApprovalOnPost?: boolean;
}

/**
 * Fully-wired Accounting Intelligence Engine.
 * All services are accessible as public properties.
 * Use createAccountingIntelligence() factory for DI.
 */
export class AccountingEngine {
  /** Composed Finance Engine — analysis layer consumes accounting facts. */
  readonly finance: FinanceEngine;

  readonly periods: AccountingPeriods;
  readonly audit: AccountingAudit;
  readonly gaap: AccountingGaap;
  readonly controls: AccountingControls;
  readonly posting: AccountingPosting;
  readonly journals: AccountingJournals;
  readonly accruals: AccountingAccruals;
  readonly deferrals: AccountingDeferrals;
  readonly allocations: AccountingAllocations;
  readonly reclassifications: AccountingReclassifications;
  readonly adjustments: AccountingAdjustments;
  readonly eliminations: AccountingEliminations;
  readonly retainedEarnings: AccountingRetainedEarnings;
  readonly consolidation: AccountingConsolidation;
  readonly reconciliation: AccountingReconciliationService;
  readonly close: AccountingClose;
  readonly nonprofit: AccountingNonprofit;
  readonly financialStatements: AccountingFinancialStatements;
  readonly disclosures: AccountingDisclosures;
  readonly reporting: AccountingReporting;
  readonly exports: AccountingExports;

  private readonly createId: (prefix: string) => string;
  private readonly now: () => Date;

  constructor(deps?: AccountingEngineDependencies) {
    this.createId =
      deps?.createId ?? ((prefix) => createAccountingId(prefix));
    this.now = deps?.now ?? (() => new Date());

    const shared = {
      createId: this.createId,
      now: this.now,
    };

    // Compose Finance Engine (do not replace)
    this.finance =
      deps?.finance ??
      createEnterpriseFinance({
        ...deps?.financeDeps,
        createId: deps?.financeDeps?.createId ?? this.createId,
        now: deps?.financeDeps?.now ?? this.now,
      });

    this.periods = new AccountingPeriods(shared);
    this.audit = new AccountingAudit(shared);
    this.gaap = new AccountingGaap({
      requireEvidenceOnPost: deps?.requireEvidenceOnPost,
      requireApprovalOnPost: deps?.requireApprovalOnPost,
    });
    this.controls = new AccountingControls({ createId: this.createId });

    this.posting = new AccountingPosting({
      ...shared,
      gl: this.finance.gl,
      periods: this.periods,
      gaap: this.gaap,
      controls: this.controls,
      audit: this.audit,
    });

    this.journals = new AccountingJournals({ posting: this.posting });

    this.accruals = new AccountingAccruals({
      ...shared,
      posting: this.posting,
      audit: this.audit,
    });
    this.deferrals = new AccountingDeferrals({
      ...shared,
      posting: this.posting,
      audit: this.audit,
    });
    this.allocations = new AccountingAllocations({
      ...shared,
      posting: this.posting,
      audit: this.audit,
    });
    this.reclassifications = new AccountingReclassifications({
      ...shared,
      posting: this.posting,
      audit: this.audit,
    });
    this.adjustments = new AccountingAdjustments({
      ...shared,
      posting: this.posting,
      audit: this.audit,
    });
    this.eliminations = new AccountingEliminations({
      ...shared,
      posting: this.posting,
      audit: this.audit,
    });
    this.retainedEarnings = new AccountingRetainedEarnings({
      ...shared,
      posting: this.posting,
      gl: this.finance.gl,
      audit: this.audit,
    });
    this.consolidation = new AccountingConsolidation({
      ...shared,
      gl: this.finance.gl,
      eliminations: this.eliminations,
    });
    this.reconciliation = new AccountingReconciliationService({
      ...shared,
      gl: this.finance.gl,
      audit: this.audit,
    });
    this.close = new AccountingClose({
      ...shared,
      periods: this.periods,
      posting: this.posting,
      reconciliation: this.reconciliation,
      controls: this.controls,
      audit: this.audit,
    });
    this.nonprofit = new AccountingNonprofit({
      ...shared,
      grants: this.finance.grants,
    });
    this.financialStatements = new AccountingFinancialStatements({
      ...shared,
      gl: this.finance.gl,
      audit: this.audit,
      budgeting: this.finance.budgeting,
      nonprofit: this.nonprofit,
    });
    this.disclosures = new AccountingDisclosures(shared);
    this.reporting = new AccountingReporting({
      ...shared,
      statements: this.financialStatements,
    });
    this.exports = new AccountingExports({
      ...shared,
      posting: this.posting,
      statements: this.financialStatements,
      audit: this.audit,
    });
  }

  /** Facts package for Financial Intelligence consumption. */
  factsForFinance(periodId?: string): AccountingFactsForFinance {
    const tb = this.finance.gl.getTrialBalance(
      this.now().toISOString().slice(0, 10)
    );
    const coa = this.finance.gl.chartOfAccounts;
    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;
    let totalRevenue = 0;
    let totalExpense = 0;

    for (const acct of coa.listAccounts()) {
      const bal = this.finance.gl.getBalance(acct.id).normalBalance;
      switch (acct.type) {
        case "asset":
          totalAssets += bal;
          break;
        case "liability":
          totalLiabilities += bal;
          break;
        case "equity":
          totalEquity += bal;
          break;
        case "revenue":
          totalRevenue += bal;
          break;
        case "expense":
          totalExpense += bal;
          break;
      }
    }

    const periods = this.periods.listPeriods();
    const openPeriodCount = periods.filter(
      (p) => p.status === "open" || p.status === "reopened"
    ).length;
    const lockedPeriodCount = periods.filter(
      (p) => p.status === "locked" || p.status === "year_end"
    ).length;

    return {
      asOfDate: this.now().toISOString().slice(0, 10),
      currency: tb.currency,
      periodId: periodId ?? null,
      trialBalanceBalanced: tb.isBalanced,
      totalDebits: tb.totalDebits,
      totalCredits: tb.totalCredits,
      postedJournalCount: this.posting.listJournals({ status: "posted" }).length,
      openPeriodCount,
      lockedPeriodCount,
      outstandingReconciliations: this.reconciliation
        .list()
        .filter((r) => r.status !== "reconciled").length,
      netIncome: totalRevenue - totalExpense,
      totalAssets,
      totalLiabilities,
      totalEquity,
      netAssetsByClass: this.nonprofit.netAssetsByClass(),
    };
  }

  /** Facts package for Executive Intelligence consumption. */
  factsForExecutive(periodId?: string): AccountingFactsForExecutive {
    const facts = this.factsForFinance(periodId);
    const closes = periodId
      ? this.close.list(periodId)
      : this.close.list();
    const latest = closes[closes.length - 1] ?? null;
    const cashAccts = this.finance.gl.chartOfAccounts
      .listByType("asset")
      .filter(
        (a) =>
          a.code.startsWith("1000") || a.name.toLowerCase().includes("cash")
      );
    let cashPosition = 0;
    for (const acct of cashAccts) {
      cashPosition += this.finance.gl.getBalance(acct.id).normalBalance;
    }

    return {
      asOfDate: facts.asOfDate,
      closeStatus: latest?.status ?? null,
      periodsLocked: facts.lockedPeriodCount,
      unpostedJournals: this.posting.listUnposted(periodId).length,
      missingReconciliations: facts.outstandingReconciliations,
      gaapViolations: 0,
      boardSignoffPending: latest?.status === "pending_board_signoff",
      netIncome: facts.netIncome,
      cashPosition,
    };
  }

  /** Integration links for Governance / Autonomy / Workflow / Twin / Memory. */
  integrationLinks(): AccountingIntegrationLinks {
    const events = this.audit.list();
    const workflows = new Set<string>();
    const recommendations = new Set<string>();
    const decisions = new Set<string>();
    const evidence = new Set<string>();
    let pendingApprovals = 0;

    for (const e of events) {
      if (e.workflowRef) workflows.add(e.workflowRef);
      if (e.recommendationRef) recommendations.add(e.recommendationRef);
      if (e.governanceDecisionRef) decisions.add(e.governanceDecisionRef);
      if (e.evidenceRef) evidence.add(e.evidenceRef);
    }
    for (const j of this.posting.listJournals({ status: "pending_approval" })) {
      pendingApprovals += 1;
      if (j.workflowRef) workflows.add(j.workflowRef);
    }

    return {
      auditEventCount: events.length,
      pendingApprovals,
      linkedWorkflows: [...workflows],
      linkedRecommendations: [...recommendations],
      linkedGovernanceDecisions: [...decisions],
      evidenceRefs: [...evidence],
    };
  }

  /**
   * Run a lightweight health-check cycle across accounting modules.
   * Produces standardized outputs for downstream intelligence layers.
   */
  runCycle(periodId?: string): AccountingEngineCycleResult {
    const cycleId = this.createId("acct-cycle");
    const ranAt = this.now().toISOString();
    const modules = [
      "periods",
      "posting",
      "journals",
      "accruals",
      "deferrals",
      "allocations",
      "reclassifications",
      "adjustments",
      "eliminations",
      "retained-earnings",
      "consolidation",
      "close",
      "financial-statements",
      "disclosures",
      "nonprofit",
      "controls",
      "gaap",
      "audit",
      "reconciliation",
      "reporting",
      "exports",
    ] as const;

    for (const module of modules) {
      this.audit.record({
        kind: "control",
        entityId: cycleId,
        entityType: "accounting-engine-cycle",
        action: `cycle.module.${module}`,
        details: { cycleId, module, ranAt },
      });
    }

    return {
      cycleId,
      ranAt,
      modulesProcessed: [...modules],
      auditEvents: this.audit.count(),
      factsForFinance: this.factsForFinance(periodId),
      factsForExecutive: this.factsForExecutive(periodId),
      integration: this.integrationLinks(),
    };
  }
}

/**
 * Factory: create a fully-wired AccountingEngine composing Finance.
 */
export function createAccountingIntelligence(
  deps?: AccountingEngineDependencies
): AccountingEngine {
  return new AccountingEngine(deps);
}
