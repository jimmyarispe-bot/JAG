/**
 * Foundation reporting snapshots — not EBITDA / board packs / AI.
 */

import {
  listAccounts,
  listBills,
  listInvoices,
  listJournals,
  listPeriods,
} from "../store";
import type { FinanceDashboard } from "../types";
import { listBanks } from "../banking";
import { listBudgets } from "../budgets";
import { listEntities } from "../entities";

export function buildFinanceDashboard(
  organizationId: string
): FinanceDashboard {
  const journals = listJournals(organizationId);
  return {
    generatedAt: new Date().toISOString(),
    entityCount: listEntities(organizationId).length,
    accountCount: listAccounts(organizationId).filter((a) => a.active).length,
    postedJournalCount: journals.filter((j) => j.status === "posted").length,
    openPayables: listBills(organizationId).filter(
      (b) => b.status === "approved" || b.status === "pending_approval"
    ).length,
    openReceivables: listInvoices(organizationId).filter(
      (i) => i.status === "sent" || i.status === "partial"
    ).length,
    bankAccountCount: listBanks(organizationId).length,
    budgetCount: listBudgets(organizationId).length,
    lockedPeriods: Object.freeze(
      listPeriods(organizationId)
        .filter((p) => p.locked)
        .map((p) => p.periodKey)
    ),
    foundationOnly: true,
  };
}

export function trialBalanceHint(organizationId: string): {
  readonly postedEntries: number;
  readonly note: string;
} {
  return {
    postedEntries: listJournals(organizationId).filter(
      (j) => j.status === "posted"
    ).length,
    note: "Full trial balance / financial statements / EBITDA are later sprints on this foundation.",
  };
}
