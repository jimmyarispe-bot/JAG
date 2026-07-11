/**
 * Accounting Intelligence — Export Packages.
 *
 * No QuickBooks SDK / external APIs — structured in-memory export payloads only.
 */

import { createAccountingId } from "@/lib/platform/accounting/ids";
import type { AccountingAudit } from "@/lib/platform/accounting/audit";
import type { AccountingFinancialStatements } from "@/lib/platform/accounting/financial-statements";
import type { AccountingPosting } from "@/lib/platform/accounting/posting";
import type { AccountingExportPackage } from "@/lib/platform/accounting/types";

export interface AccountingExportsDependencies {
  posting: AccountingPosting;
  statements: AccountingFinancialStatements;
  audit: AccountingAudit;
  createId?: (prefix: string) => string;
  now?: () => Date;
}

export class AccountingExports {
  private readonly packages: AccountingExportPackage[] = [];
  private readonly posting: AccountingPosting;
  private readonly statements: AccountingFinancialStatements;
  private readonly audit: AccountingAudit;
  private readonly createId: (prefix: string) => string;
  private readonly now: () => Date;

  constructor(deps: AccountingExportsDependencies) {
    this.posting = deps.posting;
    this.statements = deps.statements;
    this.audit = deps.audit;
    this.createId = deps.createId ?? ((prefix) => createAccountingId(prefix));
    this.now = deps.now ?? (() => new Date());
  }

  exportPeriod(
    periodId: string,
    format: "json" | "csv_summary" = "json"
  ): AccountingExportPackage {
    const journals = this.posting.listJournals({ periodId });
    const statements = this.statements
      .list()
      .filter((s) => s.periodId === periodId);

    const payload: Record<string, unknown> = {
      periodId,
      journals: journals.map((j) => ({
        id: j.id,
        journalNumber: j.journalNumber,
        journalType: j.journalType,
        status: j.status,
        memo: j.memo,
        lines: j.lines,
        financeJournalId: j.financeJournalId,
      })),
      statements: statements.map((s) => ({
        id: s.id,
        kind: s.kind,
        title: s.title,
        totals: s.totals,
        lineCount: s.lines.length,
      })),
    };

    if (format === "csv_summary") {
      payload.csvSummary = [
        "journalNumber,type,status,memo",
        ...journals.map(
          (j) =>
            `${j.journalNumber},${j.journalType},${j.status},"${j.memo.replace(/"/g, '""')}"`
        ),
      ].join("\n");
    }

    const pkg: AccountingExportPackage = {
      id: this.createId("export"),
      format,
      periodId,
      exportedAt: this.now().toISOString(),
      journalCount: journals.length,
      statementCount: statements.length,
      payload,
    };
    this.packages.push(pkg);

    this.audit.record({
      kind: "export",
      entityId: pkg.id,
      entityType: "AccountingExportPackage",
      action: "export",
      details: { periodId, format, journalCount: journals.length },
    });

    return pkg;
  }

  list(): AccountingExportPackage[] {
    return [...this.packages];
  }
}

export function createAccountingExports(
  deps: AccountingExportsDependencies
): AccountingExports {
  return new AccountingExports(deps);
}
