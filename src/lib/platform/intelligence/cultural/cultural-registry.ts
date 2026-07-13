import type { CulturalRegistry } from "@/lib/platform/intelligence/cultural/contracts";
import type { CulturalPublisher } from "@/lib/platform/intelligence/cultural/types";

export class CulturalRegistryStore implements CulturalRegistry {
  private publishers: CulturalPublisher[] = [];

  register(domain: string, capability: string): void {
    if (!this.publishers.some(p => p.domain === domain && p.capability === capability)) {
      this.publishers.push({ domain, capability });
    }
  }
  list(): CulturalPublisher[] {
    return [...this.publishers];
  }
  isRegistered(domain: string): boolean {
    return this.publishers.some(p => p.domain === domain);
  }
  clear(): void {
    this.publishers = [];
  }
}
