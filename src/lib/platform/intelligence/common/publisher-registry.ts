/**
 * Generic publisher registries (Stabilization A3).
 *
 * Two non-interchangeable patterns exist across domains:
 * - Array: multi-capability per domain, dedupe on (domain, capability)
 * - Map: one capability per domain, optional constructor seed
 */

export interface PublisherEntry {
  domain: string;
  capability: string;
}

/**
 * Array-backed publisher registry (late-domain pattern).
 * Allows multiple capabilities per domain; `isRegistered` checks domain only.
 */
export class PublisherRegistryArray<
  TPublisher extends PublisherEntry = PublisherEntry,
> {
  private publishers: TPublisher[] = [];

  register(domain: string, capability: string): void {
    if (
      !this.publishers.some(
        (p) => p.domain === domain && p.capability === capability
      )
    ) {
      this.publishers.push({ domain, capability } as TPublisher);
    }
  }

  list(): TPublisher[] {
    return [...this.publishers];
  }

  isRegistered(domain: string): boolean {
    return this.publishers.some((p) => p.domain === domain);
  }

  clear(): void {
    this.publishers.length = 0;
  }
}

/**
 * Map-backed publisher registry (product-domain pattern).
 * One capability per domain; constructor may seed defaults.
 */
export class PublisherRegistryMap<TDomain extends string = string> {
  private readonly publishers = new Map<TDomain, string>();

  constructor(
    seed: ReadonlyArray<{ domain: TDomain; capability: string }> = []
  ) {
    for (const item of seed) {
      this.register(item.domain, item.capability);
    }
  }

  register(domain: TDomain, capability: string): void {
    this.publishers.set(domain, capability);
  }

  list(): Array<{ domain: TDomain; capability: string }> {
    return [...this.publishers.entries()].map(([domain, capability]) => ({
      domain,
      capability,
    }));
  }

  isRegistered(domain: TDomain): boolean {
    return this.publishers.has(domain);
  }

  clear(): void {
    this.publishers.clear();
  }
}
