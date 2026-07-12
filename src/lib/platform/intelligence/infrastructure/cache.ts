/**
 * Intelligence Platform Infrastructure — IntelligenceCache (Sprint 027).
 */

import type { IntelligenceCache as IntelligenceCacheContract } from "@/lib/platform/intelligence/infrastructure/contracts";
import type {
  IntelligenceCacheEntryMeta,
  IntelligenceModuleId,
} from "@/lib/platform/intelligence/infrastructure/types";

interface CacheRecord {
  value: unknown;
  createdAt: number;
  expiresAt: number | null;
  hits: number;
  moduleId?: IntelligenceModuleId;
}

export class IntelligenceCacheImpl implements IntelligenceCacheContract {
  private readonly store = new Map<string, CacheRecord>();
  private hits = 0;
  private misses = 0;

  get<T = unknown>(key: string): T | undefined {
    const record = this.store.get(key);
    if (!record) {
      this.misses += 1;
      return undefined;
    }
    if (record.expiresAt !== null && Date.now() > record.expiresAt) {
      this.store.delete(key);
      this.misses += 1;
      return undefined;
    }
    record.hits += 1;
    this.hits += 1;
    return record.value as T;
  }

  set(
    key: string,
    value: unknown,
    ttlMs?: number,
    moduleId?: IntelligenceModuleId
  ): void {
    const now = Date.now();
    this.store.set(key, {
      value,
      createdAt: now,
      expiresAt: typeof ttlMs === "number" && ttlMs > 0 ? now + ttlMs : null,
      hits: 0,
      moduleId,
    });
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
    this.hits = 0;
    this.misses = 0;
  }

  size(): number {
    return this.store.size;
  }

  stats(): { hits: number; misses: number; size: number } {
    return { hits: this.hits, misses: this.misses, size: this.store.size };
  }

  listMeta(): IntelligenceCacheEntryMeta[] {
    const now = Date.now();
    const metas: IntelligenceCacheEntryMeta[] = [];
    for (const [key, record] of this.store.entries()) {
      if (record.expiresAt !== null && now > record.expiresAt) {
        continue;
      }
      metas.push({
        key,
        createdAt: new Date(record.createdAt).toISOString(),
        expiresAt:
          record.expiresAt === null
            ? null
            : new Date(record.expiresAt).toISOString(),
        hits: record.hits,
        moduleId: record.moduleId,
      });
    }
    return metas.sort((a, b) => a.key.localeCompare(b.key));
  }
}

/** Alias matching Sprint 027 naming. */
export { IntelligenceCacheImpl as IntelligenceCache };

export function createIntelligenceCache(): IntelligenceCacheImpl {
  return new IntelligenceCacheImpl();
}
