/**
 * Map Plaid normalized cache → soft signals for existing intelligence domains.
 * Feeds financial, predictive, executive, wisdom, health, resilience — no new domains.
 */

import { plaidStore, type PlaidStoreSnapshot } from "./store";

export type PlaidIntelligenceFeed = {
  sourceSystem: "plaid";
  live: true;
  syncedAt: string;
  organizationId: string;
  institutionId: string | null;
  counts: {
    institutions: number;
    accounts: number;
    transactions: number;
    liabilities: number;
    holdings: number;
  };
  cash: {
    available: number;
    current: number;
    pending: number;
    workingCapital: number;
    liquidityRatio: number;
    burnRateMonthly: number;
    cashForecast30d: number;
  };
  treasury: {
    depositoryBalance: number;
    creditUtilization: number;
    liabilityBalance: number;
    investmentValue: number;
  };
  bankBalances: Array<{
    accountId: string;
    name: string;
    subtype: string;
    available: number;
    current: number;
    pending: number;
  }>;
  financialScore: number;
  liquidityScore: number;
  predictiveScore: number;
  resilienceScore: number;
  healthScore: number;
  briefBullets: string[];
  timeline: Array<{ id: string; title: string; subtitle: string; at: string }>;
  softLights: {
    financial: { healthScore: { value: number }; financialScore: { value: number } };
    predictive: { healthScore: { value: number }; predictiveScore: { value: number } };
    resilience: { healthScore: { value: number }; resilienceScore: { value: number } };
    financialSignal: {
      healthScore: number;
      availableCash: number;
      currentCash: number;
    };
  };
  monitoring: PlaidStoreSnapshot["monitoring"];
};

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n * 10) / 10));
}

function num(v: unknown): number {
  return Number(v ?? 0);
}

export function buildPlaidIntelligenceFeed(
  snapshot: PlaidStoreSnapshot
): PlaidIntelligenceFeed | null {
  if (!snapshot.records.length || !snapshot.syncedAt) return null;

  const institutions = snapshot.byType.institution ?? [];
  const accounts = snapshot.byType.account ?? [];
  const transactions = snapshot.byType.transaction ?? [];
  const balances = snapshot.byType.balance ?? [];
  const liabilities = snapshot.byType.liability ?? [];
  const holdings = snapshot.byType.holding ?? [];
  const transfers = snapshot.byType.transfer ?? [];

  const available = balances.reduce((s, b) => s + Math.max(0, num(b.attributes.available)), 0);
  const current = balances
    .filter((b) => {
      const acct = accounts.find((a) => a.externalId === b.accountId);
      return acct?.attributes.type === "depository" || !acct;
    })
    .reduce((s, b) => s + Math.max(0, num(b.attributes.current)), 0);
  const pending = balances.reduce((s, b) => s + Math.max(0, num(b.attributes.pending)), 0);

  const depositoryBalance = balances
    .filter((b) => {
      const acct = accounts.find((a) => a.externalId === b.accountId);
      return acct?.attributes.type === "depository";
    })
    .reduce((s, b) => s + Math.max(0, num(b.attributes.current)), 0);

  const liabilityBalance = liabilities.reduce((s, l) => s + num(l.attributes.balance), 0);
  const investmentValue = holdings.reduce((s, h) => s + num(h.attributes.institutionValue), 0);

  const creditLimit = balances
    .filter((b) => {
      const acct = accounts.find((a) => a.externalId === b.accountId);
      return acct?.attributes.type === "credit";
    })
    .reduce((s, b) => s + num(b.attributes.limit), 0);
  const creditUsed = balances
    .filter((b) => {
      const acct = accounts.find((a) => a.externalId === b.accountId);
      return acct?.attributes.type === "credit";
    })
    .reduce((s, b) => s + Math.abs(Math.min(0, num(b.attributes.current))), 0);
  const creditUtilization = creditLimit > 0 ? creditUsed / creditLimit : 0;

  const outflows = transactions
    .filter((t) => num(t.attributes.amount) < 0 && !t.attributes.pending)
    .reduce((s, t) => s + Math.abs(num(t.attributes.amount)), 0);
  const burnRateMonthly = outflows; // demo window ≈ monthly ops snapshot
  const workingCapital = depositoryBalance - liabilityBalance * 0.05;
  const liquidityRatio = liabilityBalance > 0 ? depositoryBalance / liabilityBalance : 2;
  const cashForecast30d = available - burnRateMonthly * 0.25 + pending * 0.5;

  const financialScore = clamp(50 + available / 20000 - liabilityBalance / 200000);
  const liquidityScore = clamp(40 + liquidityRatio * 25 + available / 25000);
  const predictiveScore = clamp(50 + cashForecast30d / 15000 - burnRateMonthly / 10000);
  const resilienceScore = clamp(55 + available / 30000 - creditUtilization * 20);
  const healthScore = clamp((financialScore + liquidityScore + resilienceScore) / 3);

  const bankBalances = balances.map((b) => {
    const acct = accounts.find((a) => a.externalId === b.accountId);
    return {
      accountId: b.accountId ?? b.externalId,
      name: String(acct?.attributes.name ?? b.attributes.name ?? "Account"),
      subtype: String(acct?.attributes.subtype ?? "unknown"),
      available: num(b.attributes.available),
      current: num(b.attributes.current),
      pending: num(b.attributes.pending),
    };
  });

  const briefBullets = [
    `Plaid banking sync — available cash $${available.toLocaleString()} · current $${current.toLocaleString()}.`,
    `Working capital $${Math.round(workingCapital).toLocaleString()} · liquidity ratio ${liquidityRatio.toFixed(2)}.`,
    `Cash forecast (30d soft) $${Math.round(cashForecast30d).toLocaleString()} · burn $${Math.round(burnRateMonthly).toLocaleString()}.`,
    `${accounts.length} accounts · ${transactions.length} transactions · liabilities $${liabilityBalance.toLocaleString()}.`,
    investmentValue > 0
      ? `Investments $${investmentValue.toLocaleString()} across ${holdings.length} holding(s).`
      : "No investment holdings synced.",
  ];

  const timeline = [
    {
      id: "plaid-sync",
      title: "Plaid banking sync",
      subtitle: `${snapshot.records.length} records normalized into JAG`,
      at: snapshot.syncedAt,
    },
    ...transactions.slice(0, 3).map((row) => ({
      id: row.id,
      title: String(row.attributes.name ?? "Bank transaction"),
      subtitle: `${num(row.attributes.amount).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      })} · ${String(row.attributes.channel ?? row.attributes.category ?? "")}`,
      at: String(row.attributes.postedAt ?? row.syncedAt),
    })),
    ...transfers.slice(0, 1).map((row) => ({
      id: row.id,
      title: String(row.attributes.name ?? "Transfer"),
      subtitle: `$${num(row.attributes.amount).toLocaleString()}`,
      at: String(row.attributes.date ? `${row.attributes.date}T12:00:00.000Z` : row.syncedAt),
    })),
  ];

  return {
    sourceSystem: "plaid",
    live: true,
    syncedAt: snapshot.syncedAt,
    organizationId: snapshot.organizationId,
    institutionId: institutions[0]?.externalId ?? null,
    counts: {
      institutions: institutions.length,
      accounts: accounts.length,
      transactions: transactions.length,
      liabilities: liabilities.length,
      holdings: holdings.length,
    },
    cash: {
      available,
      current: depositoryBalance || current,
      pending,
      workingCapital,
      liquidityRatio,
      burnRateMonthly,
      cashForecast30d,
    },
    treasury: {
      depositoryBalance: depositoryBalance || current,
      creditUtilization,
      liabilityBalance,
      investmentValue,
    },
    bankBalances,
    financialScore,
    liquidityScore,
    predictiveScore,
    resilienceScore,
    healthScore,
    briefBullets,
    timeline,
    softLights: {
      financial: {
        healthScore: { value: financialScore },
        financialScore: { value: financialScore },
      },
      predictive: {
        healthScore: { value: predictiveScore },
        predictiveScore: { value: predictiveScore },
      },
      resilience: {
        healthScore: { value: resilienceScore },
        resilienceScore: { value: resilienceScore },
      },
      financialSignal: {
        healthScore: financialScore,
        availableCash: available,
        currentCash: depositoryBalance || current,
      },
    },
    monitoring: snapshot.monitoring,
  };
}

export function getPlaidFeed(organizationId: string): PlaidIntelligenceFeed | null {
  const snapshot = plaidStore.get(organizationId);
  if (!snapshot) return null;
  return buildPlaidIntelligenceFeed(snapshot);
}
