/**
 * Accounting Intelligence — Reporting Packages.
 */

import { createAccountingId } from "@/lib/platform/accounting/ids";
import type { AccountingFinancialStatements } from "@/lib/platform/accounting/financial-statements";
import type {
  AccountingMetadata,
  AccountingReport,
} from "@/lib/platform/accounting/types";

export interface AccountingReportingDependencies {
  statements: AccountingFinancialStatements;
  createId?: (prefix: string) => string;
  now?: () => Date;
}

export class AccountingReporting {
  private readonly reports = new Map<string, AccountingReport>();
  private readonly statements: AccountingFinancialStatements;
  private readonly createId: (prefix: string) => string;
  private readonly now: () => Date;

  constructor(deps: AccountingReportingDependencies) {
    this.statements = deps.statements;
    this.createId = deps.createId ?? ((prefix) => createAccountingId(prefix));
    this.now = deps.now ?? (() => new Date());
  }

  buildPackage(input: {
    title: string;
    periodId: string;
    statementIds?: readonly string[];
    metadata?: AccountingMetadata;
  }): AccountingReport {
    const statementIds =
      input.statementIds ??
      this.statements
        .list()
        .filter((s) => s.periodId === input.periodId)
        .map((s) => s.id);

    const report: AccountingReport = {
      id: this.createId("report"),
      title: input.title,
      periodId: input.periodId,
      statementIds,
      generatedAt: this.now().toISOString(),
      metadata: input.metadata,
    };
    this.reports.set(report.id, report);
    return report;
  }

  get(id: string): AccountingReport | undefined {
    return this.reports.get(id);
  }

  list(periodId?: string): AccountingReport[] {
    const all = [...this.reports.values()];
    return periodId ? all.filter((r) => r.periodId === periodId) : all;
  }
}

export function createAccountingReporting(
  deps: AccountingReportingDependencies
): AccountingReporting {
  return new AccountingReporting(deps);
}
