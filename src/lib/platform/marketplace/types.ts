/**
 * RC-8 — Unified Marketplace types.
 * Soft-reads existing catalogs (connectors, workflows, ECC, Copilot) — never vendor APIs.
 */

export const MARKETPLACE_VERSION = "1.0.0";

export const MARKETPLACE_CATEGORIES = [
  "connectors",
  "workflows",
  "dashboards",
  "industry_packs",
  "ai_agents",
  "reports",
  "templates",
  "sdk_extensions",
  "plugins",
] as const;

export type MarketplaceCategory = (typeof MARKETPLACE_CATEGORIES)[number];

export const MARKETPLACE_ITEM_STATUSES = [
  "draft",
  "published",
  "deprecated",
  "certified",
] as const;

export type MarketplaceItemStatus = (typeof MARKETPLACE_ITEM_STATUSES)[number];

export const MARKETPLACE_INSTALL_STATUSES = [
  "available",
  "installed",
  "enabled",
  "disabled",
] as const;

export type MarketplaceInstallStatus = (typeof MARKETPLACE_INSTALL_STATUSES)[number];

export type MarketplaceListing = {
  id: string;
  key: string;
  category: MarketplaceCategory;
  name: string;
  description: string;
  version: string;
  publisher: string;
  status: MarketplaceItemStatus;
  tags: string[];
  /** Soft-read source system — never a vendor SDK. */
  sourceSystem: string;
  pricing?: "free" | "included" | "partner";
  certified: boolean;
  dependencies?: string[];
  capabilities?: string[];
  meta?: Record<string, unknown>;
};

export type MarketplaceInstallRecord = {
  listingKey: string;
  organizationId: string;
  status: MarketplaceInstallStatus;
  installedAt: string;
  installedBy?: string;
  notes?: string;
};

export type MarketplaceSearchQuery = {
  q?: string;
  category?: MarketplaceCategory;
  tags?: string[];
  certifiedOnly?: boolean;
  installedOnly?: boolean;
  organizationId?: string;
  limit?: number;
};

export type MarketplaceSearchResult = {
  query: MarketplaceSearchQuery;
  total: number;
  items: MarketplaceListing[];
  categoriesPresent: MarketplaceCategory[];
};

export type MarketplaceCatalogSnapshot = {
  version: string;
  generatedAt: string;
  categories: Record<MarketplaceCategory, MarketplaceListing[]>;
  totals: Record<MarketplaceCategory, number>;
  totalListings: number;
  contributingDomains: string[];
};

export type MarketplaceInstallResult = {
  ok: boolean;
  record?: MarketplaceInstallRecord;
  listing?: MarketplaceListing;
  error?: string;
  /** Installs are recorded intents — never auto-execute vendor sync. */
  governance: {
    mayAutoExecute: false;
    vendorApisForbidden: true;
  };
};
