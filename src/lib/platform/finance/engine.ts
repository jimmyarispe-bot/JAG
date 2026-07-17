/**
 * Enterprise Financial Intelligence Engine — Façade.
 *
 * Wires all services together with optional dependency injection.
 * Entry point: createEnterpriseFinance(deps?).
 */

import { FinanceAuditService } from "@/lib/platform/finance/audit";
import type { FinanceAuditServiceDependencies } from "@/lib/platform/finance/audit";
import { FinanceAccountsReceivable } from "@/lib/platform/finance/ar";
import type { FinanceAccountsReceivableDependencies } from "@/lib/platform/finance/ar";
import { FinanceAccountsPayable } from "@/lib/platform/finance/ap";
import type { FinanceAccountsPayableDependencies } from "@/lib/platform/finance/ap";
import { FinanceBanking } from "@/lib/platform/finance/banking";
import type { FinanceBankingDependencies } from "@/lib/platform/finance/banking";
import { FinanceBudgeting } from "@/lib/platform/finance/budgeting";
import type { FinanceBudgetingDependencies } from "@/lib/platform/finance/budgeting";
import { FinanceCashManagement } from "@/lib/platform/finance/cash";
import type { FinanceCashManagementDependencies } from "@/lib/platform/finance/cash";
import { FinanceCpaWorkpapers } from "@/lib/platform/finance/cpa";
import type { FinanceCpaWorkpapersDependencies } from "@/lib/platform/finance/cpa";
import { FinanceAssets } from "@/lib/platform/finance/assets";
import type { FinanceAssetsDependencies } from "@/lib/platform/finance/assets";
import { FinanceDebt } from "@/lib/platform/finance/debt";
import type { FinanceDebtDependencies } from "@/lib/platform/finance/debt";
import { FinanceExecutiveIntelligence } from "@/lib/platform/finance/executive";
import type { FinanceExecutiveIntelligenceDependencies } from "@/lib/platform/finance/executive";
import { FinanceGrants } from "@/lib/platform/finance/grants";
import type { FinanceGrantsDependencies } from "@/lib/platform/finance/grants";
import {
  FinanceChartOfAccounts,
  FinanceGeneralLedger,
} from "@/lib/platform/finance/ledger";
import type {
  FinanceChartOfAccountsDependencies,
  FinanceGeneralLedgerDependencies,
} from "@/lib/platform/finance/ledger";
import { FinancePayments } from "@/lib/platform/finance/payments";
import type { FinancePaymentsDependencies } from "@/lib/platform/finance/payments";
import { FinanceQuickBooksExport } from "@/lib/platform/finance/quickbooks";
import type { FinanceQuickBooksExportDependencies } from "@/lib/platform/finance/quickbooks";
import { FinanceScholarships } from "@/lib/platform/finance/scholarships";
import type { FinanceScholarshipsDependencies } from "@/lib/platform/finance/scholarships";
import { FinanceTax } from "@/lib/platform/finance/tax";
import type { FinanceTaxDependencies } from "@/lib/platform/finance/tax";
import { createFinanceId } from "@/lib/platform/finance/ids";
import type { FinanceEngineCycleResult } from "@/lib/platform/finance/types";

export interface FinanceEngineDependencies {
  createId?: (prefix: string) => string;
  now?: () => Date;
  audit?: FinanceAuditServiceDependencies;
  coa?: FinanceChartOfAccountsDependencies;
  gl?: FinanceGeneralLedgerDependencies;
  ar?: FinanceAccountsReceivableDependencies;
  ap?: FinanceAccountsPayableDependencies;
  banking?: FinanceBankingDependencies;
  payments?: FinancePaymentsDependencies;
  cash?: FinanceCashManagementDependencies;
  budgeting?: FinanceBudgetingDependencies;
  assets?: FinanceAssetsDependencies;
  debt?: FinanceDebtDependencies;
  grants?: FinanceGrantsDependencies;
  scholarships?: FinanceScholarshipsDependencies;
  tax?: FinanceTaxDependencies;
  quickbooks?: FinanceQuickBooksExportDependencies;
  cpa?: FinanceCpaWorkpapersDependencies;
  executive?: FinanceExecutiveIntelligenceDependencies;
}

/**
 * Fully-wired Enterprise Finance Engine.
 * All services are accessible as public properties.
 * Use createEnterpriseFinance() factory for DI.
 */
export class FinanceEngine {
  readonly audit: FinanceAuditService;
  readonly coa: FinanceChartOfAccounts;
  readonly gl: FinanceGeneralLedger;
  readonly ar: FinanceAccountsReceivable;
  readonly ap: FinanceAccountsPayable;
  readonly banking: FinanceBanking;
  readonly payments: FinancePayments;
  readonly cash: FinanceCashManagement;
  readonly budgeting: FinanceBudgeting;
  readonly assets: FinanceAssets;
  readonly debt: FinanceDebt;
  readonly grants: FinanceGrants;
  readonly scholarships: FinanceScholarships;
  readonly tax: FinanceTax;
  readonly quickbooks: FinanceQuickBooksExport;
  readonly cpa: FinanceCpaWorkpapers;
  readonly executive: FinanceExecutiveIntelligence;

  private readonly createId: (prefix: string) => string;
  private readonly now: () => Date;

  constructor(deps?: FinanceEngineDependencies) {
    this.createId =
      deps?.createId ?? ((prefix) => createFinanceId(prefix));
    this.now = deps?.now ?? (() => new Date());

    // Shared DI overrides
    const shared = {
      createId: this.createId,
      now: this.now,
    };

    this.audit = new FinanceAuditService({ ...shared, ...deps?.audit });
    this.coa = new FinanceChartOfAccounts({ ...shared, ...deps?.coa });
    this.gl = new FinanceGeneralLedger({
      ...shared,
      coa: this.coa,
      ...deps?.gl,
    });
    this.ar = new FinanceAccountsReceivable({
      ...shared,
      gl: this.gl,
      ...deps?.ar,
    });
    this.ap = new FinanceAccountsPayable({
      ...shared,
      gl: this.gl,
      ...deps?.ap,
    });
    this.banking = new FinanceBanking({ ...shared, ...deps?.banking });
    this.payments = new FinancePayments({
      ...shared,
      gl: this.gl,
      ar: this.ar,
      ...deps?.payments,
    });
    this.cash = new FinanceCashManagement({ ...shared, ...deps?.cash });
    this.budgeting = new FinanceBudgeting({ ...shared, ...deps?.budgeting });
    this.assets = new FinanceAssets({ ...shared, ...deps?.assets });
    this.debt = new FinanceDebt({ ...shared, ...deps?.debt });
    this.grants = new FinanceGrants({ ...shared, ...deps?.grants });
    this.scholarships = new FinanceScholarships({
      ...shared,
      ...deps?.scholarships,
    });
    this.tax = new FinanceTax({ ...shared, ...deps?.tax });
    this.quickbooks = new FinanceQuickBooksExport({
      now: this.now,
      ...deps?.quickbooks,
    });
    this.cpa = new FinanceCpaWorkpapers({ now: this.now, ...deps?.cpa });
    this.executive = new FinanceExecutiveIntelligence({
      now: this.now,
      ...deps?.executive,
    });
  }

  /**
   * Run a lightweight health-check cycle across all modules.
   * Records audit events for each active module.
   */
  runCycle(): FinanceEngineCycleResult {
    const cycleId = this.createId("cycle");
    const ranAt = this.now().toISOString();
    const modulesProcessed: string[] = [];

    const modules = [
      "audit",
      "ledger",
      "ar",
      "ap",
      "banking",
      "payments",
      "cash",
      "budgeting",
      "assets",
      "debt",
      "grants",
      "scholarships",
      "tax",
      "quickbooks",
      "cpa",
      "executive",
    ] as const;

    for (const domainModule of modules) {
      modulesProcessed.push(domainModule);
      this.audit.record({
        kind: "recommendation",
        entityId: cycleId,
        entityType: "engine-cycle",
        action: `cycle.module.${domainModule}`,
        dimensions: {
          organizationId: null,
          schoolId: null,
          campusId: null,
          departmentId: null,
          programId: null,
          employeeId: null,
          studentId: null,
          vendorId: null,
          customerId: null,
          fundingSourceId: null,
          grantId: null,
          scholarshipId: null,
          projectId: null,
          workflowRef: null,
          evidenceRef: null,
          approvalRef: null,
          auditRef: cycleId,
        },
        details: { cycleId, module: domainModule, ranAt },
      });
    }

    return {
      cycleId,
      ranAt,
      modulesProcessed,
      auditEvents: this.audit.count(),
    };
  }
}

/**
 * Factory: create a fully-wired FinanceEngine with optional DI overrides.
 */
export function createEnterpriseFinance(
  deps?: FinanceEngineDependencies
): FinanceEngine {
  return new FinanceEngine(deps);
}
