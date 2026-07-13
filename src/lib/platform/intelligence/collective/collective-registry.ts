import type { CollectiveRegistry } from "@/lib/platform/intelligence/collective/contracts";
import type { CollectivePublisher } from "@/lib/platform/intelligence/collective/types";

export class CollectiveRegistryStore implements CollectiveRegistry {
  private publishers: CollectivePublisher[] = [];

  register(domain: string, capability: string): void {
    if (!this.publishers.some(p => p.domain === domain && p.capability === capability)) {
      this.publishers.push({ domain, capability });
    }
  }
  list(): CollectivePublisher[] {
    return [...this.publishers];
  }
  isRegistered(domain: string): boolean {
    return this.publishers.some(p => p.domain === domain);
  }
  clear(): void {
    this.publishers = [];
  }
}
