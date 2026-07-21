/**
 * Marketplace soft-reads — org-scoped view of catalog + installs + domain presence.
 * Never calls connector vendor APIs.
 */

import { softReadOrganizationalGraph } from "@/lib/platform/knowledge-graph";
import { getFinanceExecutiveFeed } from "@/lib/platform/integrations/connectors/finance";
import { getCrmExecutiveFeed } from "@/lib/platform/integrations/connectors/crm";
import { getHrExecutiveFeed } from "@/lib/platform/integrations/connectors/hr";
import { getEducationExecutiveFeed } from "@/lib/platform/integrations/connectors/education";
import { buildMarketplaceCatalogSnapshot } from "@/lib/platform/marketplace/catalog";
import { marketplaceInstallStore } from "@/lib/platform/marketplace/store/installs";
import type { MarketplaceCatalogSnapshot } from "@/lib/platform/marketplace/types";

export type MarketplaceSoftContext = {
  organizationId: string;
  catalog: MarketplaceCatalogSnapshot;
  installs: ReturnType<typeof marketplaceInstallStore.list>;
  domainsPresent: string[];
  recommendedKeys: string[];
};

export function assembleMarketplaceSoftContext(
  organizationId: string
): MarketplaceSoftContext {
  const catalog = buildMarketplaceCatalogSnapshot();
  const installs = marketplaceInstallStore.list(organizationId);
  const kg = softReadOrganizationalGraph(organizationId);
  const finance = getFinanceExecutiveFeed(organizationId);
  const crm = getCrmExecutiveFeed(organizationId);
  const hr = getHrExecutiveFeed(organizationId);
  const education = getEducationExecutiveFeed(organizationId);

  const domainsPresent = [
    kg ? "knowledge-graph" : null,
    finance ? "finance" : null,
    crm ? "crm" : null,
    hr ? "hr" : null,
    education ? "education" : null,
  ].filter((d): d is string => Boolean(d));

  const recommendedKeys: string[] = [];
  if (!finance) recommendedKeys.push("connector.stripe", "industry_pack.nonprofit_finance");
  if (!crm) recommendedKeys.push("connector.hubspot", "industry_pack.revenue_growth");
  if (!hr) recommendedKeys.push("connector.gusto", "industry_pack.people_ops");
  if (!education) recommendedKeys.push("connector.canvas", "industry_pack.k12_academy");
  if (!kg) recommendedKeys.push("dashboard.mission_control.organization_graph_viewer");
  recommendedKeys.push("ai_agent.organizational_risks", "workflow.studio.employee_onboarding");

  return {
    organizationId,
    catalog,
    installs,
    domainsPresent,
    recommendedKeys: [...new Set(recommendedKeys)].slice(0, 12),
  };
}
