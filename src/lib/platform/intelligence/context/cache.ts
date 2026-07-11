/**
 * Shared Intelligence Context — request-scoped cache.
 *
 * Caches provider results for the duration of a single build/request.
 */

/**
 * In-memory cache for shared context provider results.
 * Intended to be request-scoped (one instance per builder.build call).
 */
export class SharedIntelligenceContextCache {
  private readonly store = new Map<string, unknown>();

  /** Whether a key is present. */
  has(key: string): boolean {
    return this.store.has(key);
  }

  /** Read a cached value. */
  get<T>(key: string): T | undefined {
    if (!this.store.has(key)) return undefined;
    return this.store.get(key) as T;
  }

  /** Store a value for the remainder of the request. */
  set<T>(key: string, value: T): void {
    this.store.set(key, value);
  }

  /**
   * Get a cached value or compute, store, and return it.
   * Ensures each provider key executes at most once per cache lifetime.
   */
  async getOrSet<T>(key: string, factory: () => T | Promise<T>): Promise<T> {
    if (this.store.has(key)) {
      return this.store.get(key) as T;
    }
    const value = await Promise.resolve(factory());
    this.store.set(key, value);
    return value;
  }

  /** Remove all entries. */
  clear(): void {
    this.store.clear();
  }

  /** Number of cached entries. */
  size(): number {
    return this.store.size;
  }
}
