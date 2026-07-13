import type { SystemsRegistry } from "@/lib/platform/intelligence/systems/contracts";
import type { SystemsPublisher } from "@/lib/platform/intelligence/systems/types";

export class SystemsRegistryStore implements SystemsRegistry {
  private publishers: SystemsPublisher[] = [];

  register(domain: string, capability: string): void {
    if (!this.publishers.some(p => p.domain === domain && p.capability === capability)) {
      this.publishers.push({ domain, capability });
    }
  }
  list(): SystemsPublisher[] {
    return [...this.publishers];
  }
  isRegistered(domain: string): boolean {
    return this.publishers.some(p => p.domain === domain);
  }
  clear(): void {
    this.publishers = [];
  }
}
