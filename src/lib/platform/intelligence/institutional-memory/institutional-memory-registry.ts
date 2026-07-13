import type { InstitutionalMemoryRegistry } from "@/lib/platform/intelligence/institutional-memory/contracts";
import type { InstitutionalMemoryPublisher } from "@/lib/platform/intelligence/institutional-memory/types";

export class InstitutionalMemoryRegistryStore implements InstitutionalMemoryRegistry {
  private publishers: InstitutionalMemoryPublisher[] = [];

  register(domain: string, capability: string): void {
    if (!this.publishers.some(p => p.domain === domain && p.capability === capability)) {
      this.publishers.push({ domain, capability });
    }
  }
  list(): InstitutionalMemoryPublisher[] {
    return [...this.publishers];
  }
  isRegistered(domain: string): boolean {
    return this.publishers.some(p => p.domain === domain);
  }
  clear(): void {
    this.publishers = [];
  }
}
