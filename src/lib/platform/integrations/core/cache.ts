/**
 * Lightweight TTL cache for connector metadata, health, and sync cursors.
 */

export type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

export class IntegrationCache {
  private readonly store = new Map<string, CacheEntry<unknown>>();

  constructor(private readonly defaultTtlMs = 60_000) {}

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs = this.defaultTtlMs): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }
}
