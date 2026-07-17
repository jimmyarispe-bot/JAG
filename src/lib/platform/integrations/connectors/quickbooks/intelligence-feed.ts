/**
 * Map QuickBooks normalized cache → soft signals for existing intelligence domains.
 * Feeds financial, executive, predictive, opportunity, wisdom, health, systems, resilience.
 * No new domains.
 */

import { quickbooksStore, type QuickBooksStoreSnapshot } from "./store";

export type QuickBooksIntelligenceFeed = {
  sourceSystem: "quickbooks";
  live: true;
  syncedAt: string;
  organizationId: string;
  companyId: string | null;
  counts: {
    accounts: number;
    customers: number;
    vendors: number;
    invoices: number;
    bills: number;
    payments: number;
    journalEntries: number;
    expenses: number;
  };
  financial: {
    cash: number;
    ar: number;
    ap: number;
    revenueActual: number;
    expenseActual: number;
    revenueBudget: number;
    expenseBudget: number;
    ebitda: number;
    netIncome: number;
  };
  cashFlow: {
    deposits: number;
    expenses: number;
    transfers: number;
    overdueReceivables: number;
    overduePayables: number;
  };
  financialScore: number;
  revenueScore: number;
  expenseScore: number;
  cashFlowScore: number;
  budgetVarianceScore: number;
  opportunityScore: number;
  predictiveScore: number;
  systemsScore: number;
  resilienceScore: number;
  healthScore: number;
  briefBullets: string[];
  timeline: Array<{ id: string; title: string; subtitle: string; at: string }>;
  softLights: {
    financial: { healthScore: { value: number }; financialScore: { value: number } };
    opportunity: { healthScore: { value: number }; opportunityScore: { value: number } };
    predictive: { healthScore: { value: number }; predictiveScore: { value: number } };
    systems: { healthScore: { value: number }; systemsScore: { value: number } };
    resilience: { healthScore: { value: number }; resilienceScore: { value: number } };
    financialSignal: {
      healthScore: number;
      cash: number;
      ebitda: number;
    };
  };
  monitoring: QuickBooksStoreSnapshot["monitoring"];
};

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n * 10) / 10));
}

function num(v: unknown): number {
  return Number(v ?? 0);
}

export function buildQuickBooksIntelligenceFeed(
  snapshot: QuickBooksStoreSnapshot
): QuickBooksIntelligenceFeed | null {
  if (!snapshot.records.length || !snapshot.syncedAt) return null;

  const accounts = snapshot.byType.account ?? [];
  const customers = snapshot.byType.customer ?? [];
  const vendors = snapshot.byType.vendor ?? [];
  const invoices = snapshot.byType.invoice ?? [];
  const bills = snapshot.byType.bill ?? [];
  const payments = snapshot.byType.payment ?? [];
  const journalEntries = snapshot.byType.journal_entry ?? [];
  const expenses = snapshot.byType.expense ?? [];
  const deposits = snapshot.byType.deposit ?? [];
  const transfers = snapshot.byType.transfer ?? [];
  const budget = snapshot.byType.budget?.[0]?.attributes;
  const company = snapshot.byType.company?.[0];

  const cash = accounts
    .filter((a) => String(a.attributes.accountType) === "Bank")
    .reduce((s, a) => s + num(a.attributes.balance), 0);
  const ar = accounts
    .filter((a) => String(a.attributes.accountType) === "Accounts Receivable")
    .reduce((s, a) => s + num(a.attributes.balance), 0);
  const ap = accounts
    .filter((a) => String(a.attributes.accountType) === "Accounts Payable")
    .reduce((s, a) => s + num(a.attributes.balance), 0);

  const revenueActual = budget ? num(budget.actualRevenue) : payments.reduce((s, p) => s + num(p.attributes.totalAmt), 0) * 12;
  const expenseActual = budget
    ? num(budget.actualExpense)
    : expenses.reduce((s, e) => s + num(e.attributes.totalAmt), 0) * 12;
  const revenueBudget = budget ? num(budget.revenueBudget) : revenueActual * 1.1;
  const expenseBudget = budget ? num(budget.expenseBudget) : expenseActual * 1.05;
  const ebitda = revenueActual - expenseActual;
  const netIncome = ebitda * 0.92;

  const overdueReceivables = invoices
    .filter((i) => i.attributes.status === "OVERDUE")
    .reduce((s, i) => s + num(i.attributes.balance), 0);
  const overduePayables = bills
    .filter((b) => b.attributes.status === "OVERDUE")
    .reduce((s, b) => s + num(b.attributes.balance), 0);

  const depositTotal = deposits.reduce((s, d) => s + num(d.attributes.totalAmt), 0);
  const expenseTotal = expenses.reduce((s, e) => s + num(e.attributes.totalAmt), 0);
  const transferTotal = transfers.reduce((s, t) => s + num(t.attributes.totalAmt), 0);

  const revenueScore = clamp(55 + (revenueActual / revenueBudget) * 35);
  const expenseScore = clamp(70 - Math.max(0, expenseActual - expenseBudget) / 50000);
  const cashFlowScore = clamp(50 + cash / 20000 - overduePayables / 5000);
  const budgetVarianceScore = clamp(
    60 + ((revenueActual - expenseActual) / Math.max(revenueBudget - expenseBudget, 1)) * 20
  );
  const financialScore = clamp(
    (revenueScore + expenseScore + cashFlowScore + budgetVarianceScore) / 4
  );
  const opportunityScore = clamp(45 + ar / 10000 + (revenueBudget - revenueActual) / 50000);
  const predictiveScore = clamp(50 + ebitda / 100000 - overdueReceivables / 10000);
  const systemsScore = clamp(70 + (accounts.filter((a) => a.attributes.active !== false).length) * 2);
  const resilienceScore = clamp(55 + cash / 25000 - overduePayables / 8000);
  const healthScore = clamp((financialScore + systemsScore + resilienceScore) / 3);

  const briefBullets = [
    `QuickBooks sync active — cash $${cash.toLocaleString()} · AR $${ar.toLocaleString()} · AP $${ap.toLocaleString()}.`,
    `Budget vs actual: revenue $${revenueActual.toLocaleString()} / $${revenueBudget.toLocaleString()} · expenses $${expenseActual.toLocaleString()} / $${expenseBudget.toLocaleString()}.`,
    `EBITDA $${Math.round(ebitda).toLocaleString()} · net $${Math.round(netIncome).toLocaleString()}.`,
    overdueReceivables > 0 || overduePayables > 0
      ? `Collections pressure: overdue AR $${overdueReceivables.toLocaleString()} · overdue AP $${overduePayables.toLocaleString()}.`
      : "No overdue AR/AP balances in QuickBooks.",
    `${invoices.length} invoices · ${bills.length} bills · ${payments.length} customer payments from QuickBooks.`,
  ];

  const timeline = [
    {
      id: "qb-sync",
      title: "QuickBooks accounting sync",
      subtitle: `${snapshot.records.length} records normalized into JAG`,
      at: snapshot.syncedAt,
    },
    ...payments.slice(0, 2).map((row) => ({
      id: row.id,
      title: `Customer payment $${num(row.attributes.totalAmt).toLocaleString()}`,
      subtitle: String(row.attributes.name ?? "Payment"),
      at: String(row.attributes.txnDate ?? row.syncedAt),
    })),
    ...expenses.slice(0, 1).map((row) => ({
      id: row.id,
      title: `Expense $${num(row.attributes.totalAmt).toLocaleString()}`,
      subtitle: String(row.attributes.name ?? "Expense"),
      at: String(row.attributes.txnDate ?? row.syncedAt),
    })),
    ...deposits.slice(0, 1).map((row) => ({
      id: row.id,
      title: `Deposit $${num(row.attributes.totalAmt).toLocaleString()}`,
      subtitle: String(row.attributes.name ?? "Deposit"),
      at: String(row.attributes.txnDate ?? row.syncedAt),
    })),
  ];

  return {
    sourceSystem: "quickbooks",
    live: true,
    syncedAt: snapshot.syncedAt,
    organizationId: snapshot.organizationId,
    companyId: company?.companyId ?? company?.externalId ?? null,
    counts: {
      accounts: accounts.length,
      customers: customers.length,
      vendors: vendors.length,
      invoices: invoices.length,
      bills: bills.length,
      payments: payments.length,
      journalEntries: journalEntries.length,
      expenses: expenses.length,
    },
    financial: {
      cash,
      ar,
      ap,
      revenueActual,
      expenseActual,
      revenueBudget,
      expenseBudget,
      ebitda,
      netIncome,
    },
    cashFlow: {
      deposits: depositTotal,
      expenses: expenseTotal,
      transfers: transferTotal,
      overdueReceivables,
      overduePayables,
    },
    financialScore,
    revenueScore,
    expenseScore,
    cashFlowScore,
    budgetVarianceScore,
    opportunityScore,
    predictiveScore,
    systemsScore,
    resilienceScore,
    healthScore,
    briefBullets,
    timeline,
    softLights: {
      financial: {
        healthScore: { value: financialScore },
        financialScore: { value: financialScore },
      },
      opportunity: {
        healthScore: { value: opportunityScore },
        opportunityScore: { value: opportunityScore },
      },
      predictive: {
        healthScore: { value: predictiveScore },
        predictiveScore: { value: predictiveScore },
      },
      systems: {
        healthScore: { value: systemsScore },
        systemsScore: { value: systemsScore },
      },
      resilience: {
        healthScore: { value: resilienceScore },
        resilienceScore: { value: resilienceScore },
      },
      financialSignal: {
        healthScore: financialScore,
        cash,
        ebitda,
      },
    },
    monitoring: snapshot.monitoring,
  };
}

export function getQuickBooksFeed(
  organizationId: string
): QuickBooksIntelligenceFeed | null {
  const snapshot = quickbooksStore.get(organizationId);
  if (!snapshot) return null;
  return buildQuickBooksIntelligenceFeed(snapshot);
}
