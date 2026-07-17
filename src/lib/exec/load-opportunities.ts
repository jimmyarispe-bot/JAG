import { ensureQuickBooksSynced } from "@/lib/exec/ensure-quickbooks";
import { ensureSquareSynced } from "@/lib/exec/ensure-square";
import { quickBooksDataMode, resolveQuickBooksFeed } from "@/lib/exec/quickbooks-feed";
import { resolveSquareFeed, squareDataMode } from "@/lib/exec/square-feed";
import { getExecIntelligence } from "@/lib/exec/intelligence";
import { getExecRuntime } from "@/lib/exec/scope";
import type { ExecOpportunityTab, ExecOpportunityViewModel, ExecListItem } from "@/lib/exec/view-models";
import type { OpportunityCategory, OpportunityExchangeRecord } from "@/lib/platform/intelligence/opportunity/types";

const TAB_DEFS: Array<{
  key: ExecOpportunityTab;
  label: string;
  categories: OpportunityCategory[] | "all";
}> = [
  { key: "all", label: "All", categories: "all" },
  { key: "revenue", label: "Revenue", categories: ["revenue", "pricing", "customer_growth", "retention", "market_expansion"] },
  { key: "funding", label: "Funding", categories: ["funding"] },
  { key: "partnerships", label: "Partnerships", categories: ["partnership", "strategic_alliance", "acquisition", "merger"] },
  { key: "innovation", label: "Innovation", categories: ["innovation", "technology", "automation", "intellectual_property"] },
  { key: "savings", label: "Cost savings", categories: ["cost_reduction", "vendor_optimization", "procurement_savings", "asset_optimization"] },
  { key: "operational", label: "Operational", categories: ["automation", "vendor_optimization", "real_estate"] },
];

function toItem(o: OpportunityExchangeRecord, hint?: string): ExecListItem {
  return {
    id: o.id,
    title: o.title,
    subtitle: hint
      ? `${o.category.replaceAll("_", " ")} · impact $${Math.round(o.estimatedFinancialImpact).toLocaleString()} · ${hint}`
      : `${o.category.replaceAll("_", " ")} · impact $${Math.round(o.estimatedFinancialImpact).toLocaleString()}`,
    priority: o.priority,
    score: Math.round(o.score),
  };
}

/**
 * Opportunity Center — QB accounting + Square payment context when synced.
 */
export async function loadExecOpportunities(): Promise<ExecOpportunityViewModel> {
  const runtime = await getExecRuntime();
  const orgId = runtime.scope.organizationId;
  const [sqEnsure, qbEnsure] = await Promise.all([ensureSquareSynced(), ensureQuickBooksSynced()]);
  const square = resolveSquareFeed(orgId);
  const qb = resolveQuickBooksFeed(orgId);
  const sqMode = squareDataMode(square, sqEnsure.freshlySynced);
  const qbMode = quickBooksDataMode(qb, qbEnsure.freshlySynced);

  const intelligence = getExecIntelligence();
  const scope = { ...runtime.scope };
  const requestId = `exec-opp-${Date.now()}`;

  const opportunity = intelligence.opportunity.service.build({
    requestId,
    scope,
  });

  const exchange = [...(opportunity.exchange ?? [])].sort((a, b) => b.score - a.score);
  const hint = qb
    ? `QB $${qb.financial.revenueActual.toLocaleString()} · opp ${Math.round(qb.opportunityScore)}`
    : square
      ? `Square $${(square.payments.volumeCents7d / 100).toLocaleString()} · top ${square.topProducts[0]?.name ?? "products"} · opp ${Math.round(square.opportunityScore)}`
      : undefined;

  const tabs = TAB_DEFS.map((tab) => {
    const items =
      tab.categories === "all"
        ? exchange.map((o) => toItem(o, hint))
        : exchange
            .filter((o) => tab.categories.includes(o.category))
            .map((o) =>
              toItem(o, tab.key === "revenue" || tab.key === "all" ? hint : undefined)
            );
    return {
      key: tab.key,
      label: tab.label,
      items: items.slice(0, tab.key === "all" ? 20 : 12),
    };
  });

  return {
    generatedAt: opportunity.generatedAt,
    tabs,
    dataMode: qb ? qbMode : square ? sqMode : "model-baseline",
  };
}
