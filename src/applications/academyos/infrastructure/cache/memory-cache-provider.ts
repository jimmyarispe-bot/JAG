import type { CacheProvider } from "@/applications/academyos/infrastructure/cache/types";

type Entry = { value: unknown; expiresAt: number | null };

export function createMemoryCacheProvider(): CacheProvider {
  const store = new Map<string, Entry>();

  function alive(entry: Entry | undefined): entry is Entry {
    if (!entry) return false;
    if (entry.expiresAt != null && Date.now() > entry.expiresAt) {
      return false;
    }
    return true;
  }

  return {
    id: "memory",
    async get<T>(key: string) {
      const entry = store.get(key);
      if (!alive(entry)) {
        store.delete(key);
        return null;
      }
      return entry.value as T;
    },
    async put(key, value, options) {
      const ttl = options?.ttlSeconds;
      store.set(key, {
        value,
        expiresAt: ttl != null ? Date.now() + ttl * 1000 : null,
      });
    },
    async invalidate(key) {
      store.delete(key);
    },
    async invalidatePrefix(prefix) {
      for (const key of store.keys()) {
        if (key.startsWith(prefix)) store.delete(key);
      }
    },
  };
}
