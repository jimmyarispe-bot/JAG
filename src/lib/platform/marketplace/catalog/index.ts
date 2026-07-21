import { buildConnectorMarketplaceListings } from "@/lib/platform/marketplace/catalog/connectors";
import { buildWorkflowMarketplaceListings } from "@/lib/platform/marketplace/catalog/workflows";
import { buildDashboardMarketplaceListings } from "@/lib/platform/marketplace/catalog/dashboards";
import { buildIndustryPackListings } from "@/lib/platform/marketplace/catalog/industry-packs";
import { buildAiAgentMarketplaceListings } from "@/lib/platform/marketplace/catalog/agents";
import { buildReportMarketplaceListings } from "@/lib/platform/marketplace/catalog/reports";
import { buildTemplateMarketplaceListings } from "@/lib/platform/marketplace/catalog/templates";
import { buildSdkExtensionListings } from "@/lib/platform/marketplace/catalog/sdk-extensions";
import { buildPluginMarketplaceListings } from "@/lib/platform/marketplace/catalog/plugins";
import {
  MARKETPLACE_CATEGORIES,
  MARKETPLACE_VERSION,
  type MarketplaceCatalogSnapshot,
  type MarketplaceCategory,
  type MarketplaceListing,
} from "@/lib/platform/marketplace/types";

export function buildAllMarketplaceListings(): MarketplaceListing[] {
  return [
    ...buildConnectorMarketplaceListings(),
    ...buildWorkflowMarketplaceListings(),
    ...buildDashboardMarketplaceListings(),
    ...buildIndustryPackListings(),
    ...buildAiAgentMarketplaceListings(),
    ...buildReportMarketplaceListings(),
    ...buildTemplateMarketplaceListings(),
    ...buildSdkExtensionListings(),
    ...buildPluginMarketplaceListings(),
  ];
}

export function buildMarketplaceCatalogSnapshot(
  now: () => Date = () => new Date()
): MarketplaceCatalogSnapshot {
  const all = buildAllMarketplaceListings();
  const categories = {} as Record<MarketplaceCategory, MarketplaceListing[]>;
  const totals = {} as Record<MarketplaceCategory, number>;

  for (const cat of MARKETPLACE_CATEGORIES) {
    categories[cat] = all.filter((i) => i.category === cat);
    totals[cat] = categories[cat].length;
  }

  return {
    version: MARKETPLACE_VERSION,
    generatedAt: now().toISOString(),
    categories,
    totals,
    totalListings: all.length,
    contributingDomains: [
      "marketplace",
      "connectors",
      "workflows",
      "executive-command-center",
      "executive-copilot",
    ],
  };
}

export {
  buildConnectorMarketplaceListings,
  buildWorkflowMarketplaceListings,
  buildDashboardMarketplaceListings,
  buildIndustryPackListings,
  buildAiAgentMarketplaceListings,
  buildReportMarketplaceListings,
  buildTemplateMarketplaceListings,
  buildSdkExtensionListings,
  buildPluginMarketplaceListings,
};
