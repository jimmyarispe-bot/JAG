import type { WisdomRegistry } from "@/lib/platform/intelligence/wisdom/contracts";
import type { WisdomPublisher } from "@/lib/platform/intelligence/wisdom/types";

export class WisdomRegistryStore implements WisdomRegistry {
  private publishers: WisdomPublisher[] = [];

  register(domain: string, capability: string): void {
    if (!this.publishers.some(p => p.domain === domain && p.capability === capability)) {
      this.publishers.push({ domain, capability });
    }
  }
  list(): WisdomPublisher[] {
    return [...this.publishers];
  }
  isRegistered(domain: string): boolean {
    return this.publishers.some(p => p.domain === domain);
  }
  clear(): void {
    this.publishers = [];
  }
}
