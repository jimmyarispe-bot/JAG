/**
 * Marketplace install — records intent only.
 * Never auto-executes connector sync, remote plugins, or vendor APIs.
 */

import { getMarketplaceListing } from "@/lib/platform/marketplace/engine/search";
import { marketplaceInstallStore } from "@/lib/platform/marketplace/store/installs";
import type {
  MarketplaceInstallResult,
  MarketplaceListing,
} from "@/lib/platform/marketplace/types";

export type InstallMarketplaceItemInput = {
  organizationId: string;
  listingKey: string;
  installedBy?: string;
  notes?: string;
  /** When installing an industry pack, also record dependency intents. */
  includeDependencies?: boolean;
  now?: () => Date;
};

function installOne(
  organizationId: string,
  listing: MarketplaceListing,
  installedBy: string | undefined,
  notes: string | undefined,
  nowIso: string
) {
  return marketplaceInstallStore.upsert({
    listingKey: listing.key,
    organizationId,
    status: "installed",
    installedAt: nowIso,
    installedBy,
    notes,
  });
}

export function installMarketplaceItem(
  input: InstallMarketplaceItemInput
): MarketplaceInstallResult {
  const listing = getMarketplaceListing(input.listingKey);
  if (!listing) {
    return {
      ok: false,
      error: `Listing not found: ${input.listingKey}`,
      governance: { mayAutoExecute: false, vendorApisForbidden: true },
    };
  }

  const nowIso = (input.now ?? (() => new Date()))().toISOString();
  const record = installOne(
    input.organizationId,
    listing,
    input.installedBy,
    input.notes,
    nowIso
  );

  if (input.includeDependencies && listing.dependencies?.length) {
    for (const dep of listing.dependencies) {
      const depListing = getMarketplaceListing(dep);
      if (depListing) {
        installOne(
          input.organizationId,
          depListing,
          input.installedBy,
          `dependency of ${listing.key}`,
          nowIso
        );
      }
    }
  }

  return {
    ok: true,
    record,
    listing,
    governance: { mayAutoExecute: false, vendorApisForbidden: true },
  };
}

export function uninstallMarketplaceItem(
  organizationId: string,
  listingKey: string
): MarketplaceInstallResult {
  const listing = getMarketplaceListing(listingKey);
  const existing = marketplaceInstallStore.get(organizationId, listingKey);
  if (!existing) {
    return {
      ok: false,
      error: "Install record not found",
      listing: listing ?? undefined,
      governance: { mayAutoExecute: false, vendorApisForbidden: true },
    };
  }
  marketplaceInstallStore.setStatus(organizationId, listingKey, "disabled");
  return {
    ok: true,
    record: marketplaceInstallStore.get(organizationId, listingKey) ?? undefined,
    listing: listing ?? undefined,
    governance: { mayAutoExecute: false, vendorApisForbidden: true },
  };
}
