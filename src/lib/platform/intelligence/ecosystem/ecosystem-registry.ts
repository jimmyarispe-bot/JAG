import type { EcosystemRegistry } from "@/lib/platform/intelligence/ecosystem/contracts";
import type { EcosystemPublisher } from "@/lib/platform/intelligence/ecosystem/types";

export class EcosystemRegistryStore implements EcosystemRegistry {
  private publishers: EcosystemPublisher[] = [];

  register(domain: string, capability: string): void {
    if (!this.publishers.some(p => p.domain === domain && p.capability === capability)) {
      this.publishers.push({ domain, capability });
    }
  }
  list(): EcosystemPublisher[] {
    return [...this.publishers];
  }
  isRegistered(domain: string): boolean {
    return this.publishers.some(p => p.domain === domain);
  }
  clear(): void {
    this.publishers = [];
  }
}
