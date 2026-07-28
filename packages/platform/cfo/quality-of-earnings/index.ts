import { listCustomers, listInvoices, listVendors, listBills } from "@finance";
import { newId, nowIso } from "../ids";
import { publishCfoEvent } from "../events";
import { evaluateMetrics, metricValue } from "../metrics";
import { listQoe, upsertQoe } from "../store";
import type { QoeReport } from "../types";

function concentration(
  amounts: number[]
): number | null {
  const total = amounts.reduce((s, a) => s + a, 0);
  if (total <= 0) return null;
  const max = Math.max(...amounts, 0);
  return (max / total) * 100;
}

export function computeQoe(input: {
  organizationId: string;
  userId: string;
  periodKey: string;
}): QoeReport {
  const snap = evaluateMetrics({
    organizationId: input.organizationId,
    periodKey: input.periodKey,
  });
  const revenue = metricValue(snap, "revenue") ?? 0;
  const netIncome = metricValue(snap, "net_income") ?? 0;
  const invoices = listInvoices(input.organizationId);
  const bills = listBills(input.organizationId);
  const customers = listCustomers(input.organizationId);
  const vendors = listVendors(input.organizationId);

  const byCustomer = new Map<string, number>();
  for (const inv of invoices) {
    byCustomer.set(inv.customerId, (byCustomer.get(inv.customerId) ?? 0) + inv.amount);
  }
  const byVendor = new Map<string, number>();
  for (const b of bills) {
    byVendor.set(b.vendorId, (byVendor.get(b.vendorId) ?? 0) + b.amount);
  }

  const customerConcentration = concentration([...byCustomer.values()]);
  const vendorConcentration = concentration([...byVendor.values()]);
  const recurringShare =
    invoices.filter((i) => i.recurring).reduce((s, i) => s + i.amount, 0) /
    (revenue || 1);

  const riskFactors: string[] = [];
  if ((customerConcentration ?? 0) > 40) {
    riskFactors.push("High customer concentration (>40%).");
  }
  if ((vendorConcentration ?? 0) > 40) {
    riskFactors.push("High vendor concentration (>40%).");
  }
  if (netIncome < 0) riskFactors.push("Negative net income in period.");
  if (revenue === 0) riskFactors.push("No revenue recognized in period.");

  const revenueQualityScore = Math.max(
    0,
    Math.min(
      100,
      70 +
        (recurringShare > 0.3 ? 15 : 0) -
        ((customerConcentration ?? 0) > 40 ? 20 : 0)
    )
  );
  const expenseQualityScore = Math.max(
    0,
    Math.min(100, 75 - ((vendorConcentration ?? 0) > 40 ? 15 : 0))
  );

  const report = upsertQoe({
    id: newId("qoe"),
    organizationId: input.organizationId,
    periodKey: input.periodKey,
    revenueQualityScore,
    expenseQualityScore,
    recurringRevenueShare: revenue === 0 ? null : recurringShare * 100,
    customerConcentration,
    vendorConcentration,
    riskFactors: Object.freeze(riskFactors),
    normalizationNotes: Object.freeze([
      `Customers in scope: ${customers.length}`,
      `Vendors in scope: ${vendors.length}`,
      "Normalization uses ledger + AR/AP operational data via metric registry.",
    ]),
    generatedAt: nowIso(),
  });

  publishCfoEvent({
    type: "cfo.qoe_computed",
    organizationId: input.organizationId,
    recordType: "qoe_report",
    recordId: report.id,
    actorUserId: input.userId,
    payload: {
      revenueQualityScore,
      expenseQualityScore,
      riskCount: riskFactors.length,
    },
  });
  return report;
}

export { listQoe };
