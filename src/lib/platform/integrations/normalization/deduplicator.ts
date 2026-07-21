/**
 * Deduplication — keep latest entity per identity key.
 */

import type { Deduplicator } from "@/lib/platform/integrations/contracts";
import type { CanonicalEntity } from "@/lib/platform/integrations/types";

export class IdentityDeduplicator implements Deduplicator {
  dedupe(entities: readonly CanonicalEntity[]): {
    unique: CanonicalEntity[];
    duplicates: number;
  } {
    const byKey = new Map<string, CanonicalEntity>();
    let duplicates = 0;
    for (const entity of entities) {
      const existing = byKey.get(entity.identityKey);
      if (!existing) {
        byKey.set(entity.identityKey, entity);
        continue;
      }
      duplicates += 1;
      // Prefer newer syncedAt; fall back to last-seen.
      if (entity.syncedAt >= existing.syncedAt) {
        byKey.set(entity.identityKey, entity);
      }
    }
    return { unique: [...byKey.values()], duplicates };
  }
}

export function createDeduplicator(): IdentityDeduplicator {
  return new IdentityDeduplicator();
}
