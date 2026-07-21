/**
 * RC-8 Marketplace engine facade.
 */

import {
  buildMarketplaceCatalogSnapshot,
  buildAllMarketplaceListings,
} from "@/lib/platform/marketplace/catalog";
import {
  searchMarketplace,
  getMarketplaceListing,
} from "@/lib/platform/marketplace/engine/search";
import {
  installMarketplaceItem,
  uninstallMarketplaceItem,
  type InstallMarketplaceItemInput,
} from "@/lib/platform/marketplace/engine/install";
import { marketplaceInstallStore } from "@/lib/platform/marketplace/store/installs";
import {
  MARKETPLACE_CATEGORIES,
  MARKETPLACE_VERSION,
  type MarketplaceCategory,
  type MarketplaceSearchQuery,
} from "@/lib/platform/marketplace/types";

export class MarketplaceEngine {
  readonly version = MARKETPLACE_VERSION;

  listCategories(): MarketplaceCategory[] {
    return [...MARKETPLACE_CATEGORIES];
  }

  snapshot(now?: () => Date) {
    return buildMarketplaceCatalogSnapshot(now);
  }

  listAll() {
    return buildAllMarketplaceListings();
  }

  search(query?: MarketplaceSearchQuery) {
    return searchMarketplace(query);
  }

  get(key: string) {
    return getMarketplaceListing(key);
  }

  install(input: InstallMarketplaceItemInput) {
    return installMarketplaceItem(input);
  }

  uninstall(organizationId: string, listingKey: string) {
    return uninstallMarketplaceItem(organizationId, listingKey);
  }

  listInstalls(organizationId: string) {
    return marketplaceInstallStore.list(organizationId);
  }
}

export function createMarketplaceEngine(): MarketplaceEngine {
  return new MarketplaceEngine();
}
