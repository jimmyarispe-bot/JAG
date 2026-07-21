/**
 * RC-3.04 CRM intelligence signals from canonical entities only.
 */

import type { CrmCanonicalEntity } from "@/lib/platform/integrations/connectors/crm/entities";

function num(v: unknown): number {
  return Number(v ?? 0);
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n * 10) / 10));
}

export type RevenueAttributionSlice = {
  key: string;
  label: string;
  amount: number;
  sharePct: number;
};

export type CrmIntelligenceSignals = {
  pipelineValue: number;
  openDeals: number;
  salesForecast: number;
  pipelineHealth: number;
  customerConcentration: number;
  topCustomerSharePct: number;
  revenueAttributionByCompany: RevenueAttributionSlice[];
  revenueAttributionBySource: RevenueAttributionSlice[];
  leadCount: number;
  contactCount: number;
  companyCount: number;
  activityCount: number;
};

function isOpenStage(stage: string): boolean {
  const s = stage.toLowerCase();
  return s !== "enrolled" && s !== "closed won" && s !== "closed lost" && s !== "won";
}

function opportunities(records: readonly CrmCanonicalEntity[]): CrmCanonicalEntity[] {
  return records.filter(
    (r) => r.objectType === "deal" || r.objectType === "opportunity"
  );
}

export function computeCrmSignals(
  records: readonly CrmCanonicalEntity[]
): CrmIntelligenceSignals {
  const opps = opportunities(records);
  const open = opps.filter((d) => isOpenStage(String(d.attributes.stage ?? "")));
  const pipelineValue = open.reduce((s, d) => s + num(d.attributes.amount), 0);
  const salesForecast = Math.round(
    open.reduce((s, d) => s + num(d.attributes.amount) * num(d.attributes.probability), 0)
  );

  const withActivity = new Set<string>();
  for (const a of records.filter((r) => r.objectType === "activity")) {
    const dealId = a.attributes.dealId ?? a.attributes.opportunityId;
    if (typeof dealId === "string") withActivity.add(dealId);
  }
  const covered = open.filter((d) => withActivity.has(d.externalId)).length;
  const coverage = open.length ? covered / open.length : 1;
  const avgProb =
    open.length > 0
      ? open.reduce((s, d) => s + num(d.attributes.probability), 0) / open.length
      : 0;
  const pipelineHealth = clamp(
    40 + coverage * 30 + avgProb * 25 + (open.length >= 2 ? 5 : 0)
  );

  const byCompany = new Map<string, number>();
  for (const d of open) {
    const companyId = String(d.attributes.companyId ?? "unknown");
    byCompany.set(companyId, (byCompany.get(companyId) ?? 0) + num(d.attributes.amount));
  }
  const companyAmounts = [...byCompany.values()];
  const total = companyAmounts.reduce((a, b) => a + b, 0) || 1;
  const hhi = companyAmounts.reduce((s, a) => s + (a / total) ** 2, 0);
  const customerConcentration = clamp(hhi * 100);
  const topCustomerSharePct =
    companyAmounts.length > 0
      ? Math.round((Math.max(...companyAmounts) / total) * 1000) / 10
      : 0;

  const companies = records.filter((r) => r.objectType === "company");
  const companyName = (id: string) =>
    companies.find((c) => c.externalId === id)?.attributes.name ?? id;

  const revenueAttributionByCompany: RevenueAttributionSlice[] = [...byCompany.entries()]
    .map(([key, amount]) => ({
      key,
      label: String(companyName(key)),
      amount: Math.round(amount),
      sharePct: Math.round((amount / total) * 1000) / 10,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);

  const bySource = new Map<string, number>();
  for (const d of open) {
    const source = String(d.attributes.source ?? "unknown");
    bySource.set(source, (bySource.get(source) ?? 0) + num(d.attributes.amount));
  }
  const sourceTotal = [...bySource.values()].reduce((a, b) => a + b, 0) || 1;
  const revenueAttributionBySource: RevenueAttributionSlice[] = [...bySource.entries()]
    .map(([key, amount]) => ({
      key,
      label: key,
      amount: Math.round(amount),
      sharePct: Math.round((amount / sourceTotal) * 1000) / 10,
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    pipelineValue: Math.round(pipelineValue),
    openDeals: open.length,
    salesForecast,
    pipelineHealth,
    customerConcentration,
    topCustomerSharePct,
    revenueAttributionByCompany,
    revenueAttributionBySource,
    leadCount: records.filter((r) => r.objectType === "lead").length,
    contactCount: records.filter((r) => r.objectType === "contact").length,
    companyCount: companies.length,
    activityCount: records.filter((r) => r.objectType === "activity").length,
  };
}
