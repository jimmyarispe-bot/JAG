/**
 * Map Square normalized cache → soft signals for existing intelligence domains.
 * Feeds financial, customer, opportunity, predictive, executive, wisdom — no new domains.
 */

import { squareStore, type SquareStoreSnapshot } from "./store";

export type SquareIntelligenceFeed = {
  sourceSystem: "square";
  live: true;
  syncedAt: string;
  organizationId: string;
  counts: {
    payments: number;
    refunds: number;
    customers: number;
    orders: number;
    invoices: number;
    subscriptions: number;
    giftCards: number;
    locations: number;
    catalogItems: number;
    employees: number;
    customerGroups: number;
    orderLineItems: number;
  };
  payments: {
    volumeCents24h: number;
    volumeCents7d: number;
    count24h: number;
    avgTicketCents: number;
    tipsCents: number;
    feesCents: number;
    taxesCents: number;
    refundCents: number;
    refundRate: number;
  };
  cashFlow: {
    depositsCompletedCents: number;
    depositsPendingCents: number;
    openInvoicesCents: number;
    overdueInvoicesCents: number;
    giftCardLiabilityCents: number;
  };
  customers: {
    count: number;
    lifetimeValueTotalCents: number;
    avgLifetimeValueCents: number;
    activePurchasers: number;
  };
  subscriptions: {
    active: number;
    cancelled: number;
    mrrCents: number;
  };
  topProducts: Array<{ id: string; name: string; quantity: number; amountCents: number }>;
  paymentTrends: Array<{ date: string; amountCents: number; payments: number }>;
  refundTrends: Array<{ date: string; amountCents: number; refunds: number }>;
  revenueForecastCents: number;
  revenueScore: number;
  financialScore: number;
  customerScore: number;
  opportunityScore: number;
  predictiveScore: number;
  briefBullets: string[];
  timeline: Array<{ id: string; title: string; subtitle: string; at: string }>;
  dailySales: Array<{ date: string; amountCents: number; payments: number }>;
  softLights: {
    financial: { healthScore: { value: number }; financialScore: { value: number } };
    customer: { healthScore: { value: number }; customerScore: { value: number } };
    opportunity: { healthScore: { value: number }; opportunityScore: { value: number } };
    predictive: { healthScore: { value: number }; predictiveScore: { value: number } };
    financialSignal: {
      healthScore: number;
      paymentVolumeCents: number;
      cashPendingCents: number;
    };
  };
  monitoring: SquareStoreSnapshot["monitoring"];
};

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n * 10) / 10));
}

function cents(n: unknown): number {
  return Number(n ?? 0);
}

export function buildSquareIntelligenceFeed(
  snapshot: SquareStoreSnapshot
): SquareIntelligenceFeed | null {
  if (!snapshot.records.length || !snapshot.syncedAt) return null;

  const payments = snapshot.byType.payment ?? [];
  const refunds = snapshot.byType.refund ?? [];
  const customers = snapshot.byType.customer ?? [];
  const orders = snapshot.byType.order ?? [];
  const invoices = snapshot.byType.invoice ?? [];
  const subscriptions = snapshot.byType.subscription ?? [];
  const giftCards = snapshot.byType.gift_card ?? [];
  const locations = snapshot.byType.location ?? [];
  const catalogItems = snapshot.byType.catalog_item ?? [];
  const deposits = snapshot.byType.deposit ?? [];
  const tips = snapshot.byType.tip ?? [];
  const fees = snapshot.byType.fee ?? [];
  const taxes = snapshot.byType.tax ?? [];
  const employees = snapshot.byType.employee ?? [];
  const customerGroups = snapshot.byType.customer_group ?? [];
  const orderLineItems = snapshot.byType.order_line_item ?? [];

  const volumeCents7d = payments.reduce((sum, p) => sum + cents(p.attributes.amountCents), 0);
  const tipsCents =
    tips.reduce((sum, t) => sum + cents(t.attributes.amountCents), 0) ||
    payments.reduce((sum, p) => sum + cents(p.attributes.tipCents), 0);
  const feesCents =
    fees.reduce((sum, f) => sum + cents(f.attributes.amountCents), 0) ||
    payments.reduce((sum, p) => sum + cents(p.attributes.feeCents), 0);
  const taxesCents =
    taxes.reduce((sum, t) => sum + cents(t.attributes.amountCents), 0) ||
    payments.reduce((sum, p) => sum + cents(p.attributes.taxCents), 0);
  const refundCents = refunds.reduce((sum, r) => sum + cents(r.attributes.amountCents), 0);
  const refundRate = volumeCents7d > 0 ? refundCents / volumeCents7d : 0;

  // Treat demo window as "24h" volume for ECC widgets (deterministic)
  const recentCutoff = "2026-07-13T00:00:00.000Z";
  const payments24h = payments.filter(
    (p) => String(p.attributes.createdAt ?? p.syncedAt) >= recentCutoff
  );
  const volumeCents24h = payments24h.reduce(
    (sum, p) => sum + cents(p.attributes.amountCents),
    0
  );

  const avgTicketCents =
    payments.length > 0 ? Math.round(volumeCents7d / payments.length) : 0;

  const depositsCompletedCents = deposits
    .filter((d) => d.attributes.status === "COMPLETED")
    .reduce((sum, d) => sum + cents(d.attributes.amountCents), 0);
  const depositsPendingCents = deposits
    .filter((d) => d.attributes.status === "PENDING")
    .reduce((sum, d) => sum + cents(d.attributes.amountCents), 0);
  const openInvoicesCents = invoices
    .filter((i) => i.attributes.status === "OPEN")
    .reduce((sum, i) => sum + cents(i.attributes.amountCents), 0);
  const overdueInvoicesCents = invoices
    .filter((i) => i.attributes.status === "OVERDUE")
    .reduce((sum, i) => sum + cents(i.attributes.amountCents), 0);
  const giftCardLiabilityCents = giftCards.reduce(
    (sum, g) => sum + cents(g.attributes.balanceCents),
    0
  );

  const lifetimeValueTotalCents = customers.reduce(
    (sum, c) => sum + cents(c.attributes.lifetimeValueCents),
    0
  );
  const activePurchasers = customers.filter(
    (c) => cents(c.attributes.purchaseCount) > 0
  ).length;

  const activeSubs = subscriptions.filter((s) => s.attributes.status === "ACTIVE");
  const cancelledSubs = subscriptions.filter((s) => s.attributes.status === "CANCELLED");
  const mrrCents = activeSubs.reduce((sum, s) => sum + cents(s.attributes.amountCents), 0);

  const revenueScore = clamp(
    50 + payments.length * 4 + volumeCents7d / 2000 - refundRate * 40
  );
  const financialScore = clamp(
    55 +
      depositsCompletedCents / 50000 +
      (depositsPendingCents > 0 ? 5 : 0) -
      overdueInvoicesCents / 2000
  );
  const customerScore = clamp(50 + customers.length * 8 + activePurchasers * 4);
  const opportunityScore = clamp(
    45 + openInvoicesCents / 1000 + mrrCents / 500 + catalogItems.length * 3
  );
  const predictiveScore = clamp(
    50 + activeSubs.length * 10 - cancelledSubs.length * 5 + volumeCents24h / 1500
  );

  const dailyMap = new Map<string, { amountCents: number; payments: number }>();
  for (const payment of payments) {
    const created = String(payment.attributes.createdAt ?? payment.syncedAt);
    const date = created.slice(0, 10);
    const row = dailyMap.get(date) ?? { amountCents: 0, payments: 0 };
    row.amountCents += cents(payment.attributes.amountCents);
    row.payments += 1;
    dailyMap.set(date, row);
  }
  const dailySales = [...dailyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, row]) => ({ date, ...row }));

  const refundMap = new Map<string, { amountCents: number; refunds: number }>();
  for (const refund of refunds) {
    const created = String(refund.attributes.createdAt ?? refund.syncedAt);
    const date = created.slice(0, 10);
    const row = refundMap.get(date) ?? { amountCents: 0, refunds: 0 };
    row.amountCents += cents(refund.attributes.amountCents);
    row.refunds += 1;
    refundMap.set(date, row);
  }
  const refundTrends = [...refundMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, row]) => ({ date, ...row }));

  const productMap = new Map<string, { id: string; name: string; quantity: number; amountCents: number }>();
  for (const line of orderLineItems) {
    const id = String(line.attributes.catalogItemId ?? line.externalId);
    const name = String(line.attributes.name ?? "Item");
    const row = productMap.get(id) ?? { id, name, quantity: 0, amountCents: 0 };
    row.quantity += Number(line.attributes.quantity ?? 1);
    row.amountCents += cents(line.attributes.amountCents);
    productMap.set(id, row);
  }
  const topProducts = [...productMap.values()]
    .sort((a, b) => b.amountCents - a.amountCents)
    .slice(0, 5);

  const revenueForecastCents = Math.round(
    volumeCents7d * 4 + mrrCents + depositsPendingCents * 0.5
  );

  const briefBullets = [
    `Square sync active — $${(volumeCents7d / 100).toLocaleString()} payment volume across ${payments.length} payments.`,
    `Customer activity: ${customers.length} profiles · avg LTV $${Math.round(lifetimeValueTotalCents / Math.max(customers.length, 1) / 100).toLocaleString()}.`,
    `Cash flow: $${(depositsCompletedCents / 100).toLocaleString()} deposited · $${(depositsPendingCents / 100).toLocaleString()} pending.`,
    overdueInvoicesCents > 0
      ? `Overdue invoices $${(overdueInvoicesCents / 100).toLocaleString()} require collection attention.`
      : "No overdue Square invoices.",
    activeSubs.length > 0
      ? `${activeSubs.length} active subscription(s) · MRR $${(mrrCents / 100).toLocaleString()}.`
      : "No active Square subscriptions.",
    topProducts[0]
      ? `Top product: ${topProducts[0].name} · $${(topProducts[0].amountCents / 100).toLocaleString()}.`
      : `Catalog synced: ${catalogItems.length} item(s).`,
    `Revenue forecast (soft): $${(revenueForecastCents / 100).toLocaleString()} near-term.`,
  ];

  const timeline = [
    {
      id: "sq-sync",
      title: "Square payment sync",
      subtitle: `${snapshot.records.length} records normalized into JAG`,
      at: snapshot.syncedAt,
    },
    ...payments.slice(0, 3).map((row) => ({
      id: row.id,
      title: `Payment ${(cents(row.attributes.amountCents) / 100).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      })}`,
      subtitle: `${row.locationId ?? "merchant"} · ${String(row.attributes.status ?? "COMPLETED")}`,
      at: String(row.attributes.createdAt ?? row.syncedAt),
    })),
    ...deposits.slice(0, 1).map((row) => ({
      id: row.id,
      title: String(row.attributes.name ?? "Deposit"),
      subtitle: `${String(row.attributes.status)} · $${(cents(row.attributes.amountCents) / 100).toLocaleString()}`,
      at: String(row.attributes.arrivedAt ?? row.syncedAt),
    })),
  ];

  return {
    sourceSystem: "square",
    live: true,
    syncedAt: snapshot.syncedAt,
    organizationId: snapshot.organizationId,
    counts: {
      payments: payments.length,
      refunds: refunds.length,
      customers: customers.length,
      orders: orders.length,
      invoices: invoices.length,
      subscriptions: subscriptions.length,
      giftCards: giftCards.length,
      locations: locations.length,
      catalogItems: catalogItems.length,
      employees: employees.length,
      customerGroups: customerGroups.length,
      orderLineItems: orderLineItems.length,
    },
    payments: {
      volumeCents24h,
      volumeCents7d,
      count24h: payments24h.length,
      avgTicketCents,
      tipsCents,
      feesCents,
      taxesCents,
      refundCents,
      refundRate,
    },
    cashFlow: {
      depositsCompletedCents,
      depositsPendingCents,
      openInvoicesCents,
      overdueInvoicesCents,
      giftCardLiabilityCents,
    },
    customers: {
      count: customers.length,
      lifetimeValueTotalCents,
      avgLifetimeValueCents: Math.round(
        lifetimeValueTotalCents / Math.max(customers.length, 1)
      ),
      activePurchasers,
    },
    subscriptions: {
      active: activeSubs.length,
      cancelled: cancelledSubs.length,
      mrrCents,
    },
    topProducts,
    paymentTrends: dailySales,
    refundTrends,
    revenueForecastCents,
    revenueScore,
    financialScore,
    customerScore,
    opportunityScore,
    predictiveScore,
    briefBullets,
    timeline,
    dailySales,
    softLights: {
      financial: {
        healthScore: { value: financialScore },
        financialScore: { value: financialScore },
      },
      customer: {
        healthScore: { value: customerScore },
        customerScore: { value: customerScore },
      },
      opportunity: {
        healthScore: { value: opportunityScore },
        opportunityScore: { value: opportunityScore },
      },
      predictive: {
        healthScore: { value: predictiveScore },
        predictiveScore: { value: predictiveScore },
      },
      financialSignal: {
        healthScore: financialScore,
        paymentVolumeCents: volumeCents7d,
        cashPendingCents: depositsPendingCents,
      },
    },
    monitoring: snapshot.monitoring,
  };
}

export function getSquareFeed(organizationId: string): SquareIntelligenceFeed | null {
  const snapshot = squareStore.get(organizationId);
  if (!snapshot) return null;
  return buildSquareIntelligenceFeed(snapshot);
}
