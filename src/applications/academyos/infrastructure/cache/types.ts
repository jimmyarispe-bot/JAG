export type CacheProvider = {
  readonly id: "memory";
  get<T = unknown>(key: string): Promise<T | null>;
  put<T = unknown>(
    key: string,
    value: T,
    options?: { ttlSeconds?: number }
  ): Promise<void>;
  invalidate(key: string): Promise<void>;
  invalidatePrefix?(prefix: string): Promise<void>;
};
