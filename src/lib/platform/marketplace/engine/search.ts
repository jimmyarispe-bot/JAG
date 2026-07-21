import { buildAllMarketplaceListings } from "@/lib/platform/marketplace/catalog";
import { marketplaceInstallStore } from "@/lib/platform/marketplace/store/installs";
import type {
  MarketplaceCategory,
  MarketplaceListing,
  MarketplaceSearchQuery,
  MarketplaceSearchResult,
} from "@/lib/platform/marketplace/types";

export function searchMarketplace(
  query: MarketplaceSearchQuery = {}
): MarketplaceSearchResult {
  let items = buildAllMarketplaceListings();
  const q = (query.q ?? "").trim().toLowerCase();

  if (query.category) {
    items = items.filter((i) => i.category === query.category);
  }
  if (query.certifiedOnly) {
    items = items.filter((i) => i.certified);
  }
  if (query.tags?.length) {
    const tags = new Set(query.tags.map((t) => t.toLowerCase()));
    items = items.filter((i) => i.tags.some((t) => tags.has(t.toLowerCase())));
  }
  if (q) {
    items = items.filter((i) => {
      const hay = `${i.name} ${i.description} ${i.key} ${i.tags.join(" ")} ${i.publisher}`.toLowerCase();
      return hay.includes(q);
    });
  }
  if (query.installedOnly && query.organizationId) {
    const installed = new Set(
      marketplaceInstallStore.list(query.organizationId).map((r) => r.listingKey)
    );
    items = items.filter((i) => installed.has(i.key));
  }

  const limit = query.limit ?? 100;
  const sliced = items.slice(0, limit);
  const categoriesPresent = [
    ...new Set(sliced.map((i) => i.category)),
  ] as MarketplaceCategory[];

  return {
    query,
    total: items.length,
    items: sliced,
    categoriesPresent,
  };
}

export function getMarketplaceListing(key: string): MarketplaceListing | null {
  return buildAllMarketplaceListings().find((i) => i.key === key) ?? null;
}
