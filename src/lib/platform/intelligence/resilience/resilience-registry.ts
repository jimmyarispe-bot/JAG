import type { ResilienceRegistry } from "@/lib/platform/intelligence/resilience/contracts";
import type { ResiliencePublisher } from "@/lib/platform/intelligence/resilience/types";

export class ResilienceRegistryStore implements ResilienceRegistry {
  private publishers: ResiliencePublisher[] = [];

  register(domain: string, capability: string): void {
    if (!this.publishers.some(p => p.domain === domain && p.capability === capability)) {
      this.publishers.push({ domain, capability });
    }
  }
  list(): ResiliencePublisher[] {
    return [...this.publishers];
  }
  isRegistered(domain: string): boolean {
    return this.publishers.some(p => p.domain === domain);
  }
  clear(): void {
    this.publishers = [];
  }
}
