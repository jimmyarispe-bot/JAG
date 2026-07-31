/**
 * Capability Pack discovery catalog — in-memory registry (no marketplace UI).
 */

import type { CapabilityPack, IndustryId } from "@/jag/blueprints/contracts";
import type { CapabilityPackCatalogEntry } from "@/jag/capability-packs/contracts";
import { isPackCompatibleWithIndustry } from "@/jag/capability-packs/compatibility";
import { packProvidesModules } from "@/jag/capability-packs/versioning";

export type CapabilityPackSearchQuery = {
  readonly text?: string;
  readonly category?: string;
  readonly industryId?: IndustryId;
  readonly keyword?: string;
  readonly status?: CapabilityPack["status"];
  readonly featuredOnly?: boolean;
};

export class CapabilityPackCatalog {
  private readonly entries = new Map<string, CapabilityPackCatalogEntry>();

  clear(): void {
    this.entries.clear();
  }

  register(
    pack: CapabilityPack,
    registeredAt = new Date().toISOString()
  ): void {
    this.entries.set(
      pack.id,
      Object.freeze({
        pack,
        registeredAt,
      })
    );
  }

  unregister(packId: string): boolean {
    return this.entries.delete(packId);
  }

  get(packId: string): CapabilityPack | undefined {
    return this.entries.get(packId)?.pack;
  }

  list(): readonly CapabilityPack[] {
    return Object.freeze(
      [...this.entries.values()]
        .map((e) => e.pack)
        .sort((a, b) => a.id.localeCompare(b.id))
    );
  }

  search(query: CapabilityPackSearchQuery = {}): readonly CapabilityPack[] {
    const text = query.text?.toLowerCase();
    return Object.freeze(
      this.list().filter((pack) => {
        const status = pack.status ?? "published";
        if (query.status && status !== query.status) return false;
        if (query.featuredOnly && !pack.discovery?.featured) return false;
        if (
          query.category &&
          pack.discovery?.category !== query.category
        ) {
          return false;
        }
        if (
          query.keyword &&
          !(pack.discovery?.keywords ?? []).includes(query.keyword)
        ) {
          return false;
        }
        if (
          query.industryId &&
          !isPackCompatibleWithIndustry(pack, query.industryId)
        ) {
          return false;
        }
        if (text) {
          const hay = [
            pack.id,
            pack.label,
            pack.name,
            pack.description,
            ...(pack.tags ?? []),
            ...packProvidesModules(pack),
            ...(pack.discovery?.keywords ?? []),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          if (!hay.includes(text)) return false;
        }
        return true;
      })
    );
  }
}

/** Process-local default catalog for tests / hosts. */
let defaultCatalog: CapabilityPackCatalog | undefined;

export function getDefaultCapabilityPackCatalog(): CapabilityPackCatalog {
  if (!defaultCatalog) defaultCatalog = new CapabilityPackCatalog();
  return defaultCatalog;
}

export function resetDefaultCapabilityPackCatalogForTests(): void {
  defaultCatalog?.clear();
  defaultCatalog = undefined;
}
