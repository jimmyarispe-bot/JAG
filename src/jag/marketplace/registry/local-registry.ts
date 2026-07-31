/**
 * Local Marketplace Registry — in-memory discovery (no remote service).
 */

import type {
  MarketplaceArtifact,
  MarketplaceArtifactKind,
  MarketplacePackageManifest,
} from "@/jag/marketplace/contracts";

export type MarketplaceListQuery = {
  readonly kind?: MarketplaceArtifactKind;
  readonly tag?: string;
  readonly industry?: string;
  readonly maturity?: string;
  readonly q?: string;
};

export class LocalMarketplaceRegistry {
  private readonly artifacts = new Map<string, MarketplaceArtifact>();

  register(artifact: MarketplaceArtifact): void {
    this.artifacts.set(artifact.manifest.id, artifact);
  }

  unregister(id: string): boolean {
    return this.artifacts.delete(id);
  }

  clear(): void {
    this.artifacts.clear();
  }

  get(id: string): MarketplaceArtifact | undefined {
    return this.artifacts.get(id);
  }

  has(id: string): boolean {
    return this.artifacts.has(id);
  }

  list(query: MarketplaceListQuery = {}): readonly MarketplaceArtifact[] {
    return Object.freeze(
      [...this.artifacts.values()]
        .filter((a) => matches(a, query))
        .sort((a, b) => a.manifest.id.localeCompare(b.manifest.id))
    );
  }

  listManifests(
    query: MarketplaceListQuery = {}
  ): readonly MarketplacePackageManifest[] {
    return Object.freeze(this.list(query).map((a) => a.manifest));
  }

  listCapabilityPacks(): readonly MarketplaceArtifact[] {
    return this.list({ kind: "capability-pack" });
  }

  listIndustryBlueprints(): readonly MarketplaceArtifact[] {
    return this.list({ kind: "industry-blueprint" });
  }

  listOrganizationBlueprints(): readonly MarketplaceArtifact[] {
    return this.list({ kind: "organization-blueprint" });
  }

  size(): number {
    return this.artifacts.size;
  }
}

function matches(
  artifact: MarketplaceArtifact,
  query: MarketplaceListQuery
): boolean {
  const m = artifact.manifest;
  if (query.kind && m.kind !== query.kind) return false;
  if (query.maturity && m.metadata.maturity !== query.maturity) return false;
  if (query.industry && m.metadata.industry !== query.industry) return false;
  if (query.tag && !m.tags.includes(query.tag)) return false;
  if (query.q) {
    const q = query.q.toLowerCase();
    const hay = [
      m.id,
      m.name,
      m.description,
      ...m.tags,
      m.metadata.category ?? "",
      m.metadata.industry ?? "",
    ]
      .join(" ")
      .toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

let defaultRegistry: LocalMarketplaceRegistry | undefined;

export function getDefaultMarketplaceRegistry(): LocalMarketplaceRegistry {
  if (!defaultRegistry) {
    defaultRegistry = new LocalMarketplaceRegistry();
  }
  return defaultRegistry;
}

export function resetDefaultMarketplaceRegistryForTests(): void {
  defaultRegistry = undefined;
}
