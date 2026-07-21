/**
 * RC-8 — Unified Marketplace
 *
 * Connector Marketplace · Workflow Marketplace · Dashboard Marketplace
 * Industry Packs · AI Agents · Reports · Templates · SDK Extensions · Third-party Plugins
 *
 * Soft-reads existing platform catalogs (connectors, workflows, ECC, Copilot).
 * Install records intent only — never calls connector vendor APIs or loads remote plugin code.
 */

export {
  MARKETPLACE_VERSION,
  MARKETPLACE_CATEGORIES,
  MARKETPLACE_ITEM_STATUSES,
  MARKETPLACE_INSTALL_STATUSES,
  type MarketplaceCategory,
  type MarketplaceItemStatus,
  type MarketplaceInstallStatus,
  type MarketplaceListing,
  type MarketplaceInstallRecord,
  type MarketplaceSearchQuery,
  type MarketplaceSearchResult,
  type MarketplaceCatalogSnapshot,
  type MarketplaceInstallResult,
} from "./types";

export {
  buildAllMarketplaceListings,
  buildMarketplaceCatalogSnapshot,
  buildConnectorMarketplaceListings,
  buildWorkflowMarketplaceListings,
  buildDashboardMarketplaceListings,
  buildIndustryPackListings,
  buildAiAgentMarketplaceListings,
  buildReportMarketplaceListings,
  buildTemplateMarketplaceListings,
  buildSdkExtensionListings,
  buildPluginMarketplaceListings,
} from "./catalog";

export { searchMarketplace, getMarketplaceListing } from "./engine/search";
export {
  installMarketplaceItem,
  uninstallMarketplaceItem,
  type InstallMarketplaceItemInput,
} from "./engine/install";
export {
  MarketplaceEngine,
  createMarketplaceEngine,
} from "./engine/marketplace-engine";

export { marketplaceInstallStore } from "./store/installs";
export {
  assembleMarketplaceSoftContext,
  type MarketplaceSoftContext,
} from "./context/soft-reads";
