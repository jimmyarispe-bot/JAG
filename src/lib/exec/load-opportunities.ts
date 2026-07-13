import { DEFAULT_EXEC_SCOPE, getExecIntelligence } from "@/lib/exec/intelligence";
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

function toItem(o: OpportunityExchangeRecord): ExecListItem {
  return {
    id: o.id,
    title: o.title,
    subtitle: `${o.category.replaceAll("_", " ")} · impact $${Math.round(o.estimatedFinancialImpact).toLocaleString()}`,
    priority: o.priority,
    score: Math.round(o.score),
  };
}

/**
 * Opportunity Center — ranked value-creating moves from Opportunity Intelligence.
 */
export function loadExecOpportunities(): ExecOpportunityViewModel {
  const intelligence = getExecIntelligence();
  const scope = { ...DEFAULT_EXEC_SCOPE };
  const requestId = `exec-opp-${Date.now()}`;

  const opportunity = intelligence.opportunity.service.build({
    requestId,
    scope,
  });

  const exchange = [...(opportunity.exchange ?? [])].sort((a, b) => b.score - a.score);

  const tabs = TAB_DEFS.map((tab) => {
    const items =
      tab.categories === "all"
        ? exchange.map(toItem)
        : exchange.filter((o) => tab.categories.includes(o.category)).map(toItem);
    return {
      key: tab.key,
      label: tab.label,
      items: items.slice(0, tab.key === "all" ? 20 : 12),
    };
  });

  return {
    generatedAt: opportunity.generatedAt,
    tabs,
    dataMode: "model-baseline",
  };
}
