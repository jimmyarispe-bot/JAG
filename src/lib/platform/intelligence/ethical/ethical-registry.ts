import type { EthicalRegistry } from "@/lib/platform/intelligence/ethical/contracts";
import type { EthicalPublisher } from "@/lib/platform/intelligence/ethical/types";

export class EthicalRegistryStore implements EthicalRegistry {
  private publishers: EthicalPublisher[] = [];

  register(domain: string, capability: string): void {
    if (!this.publishers.some(p => p.domain === domain && p.capability === capability)) {
      this.publishers.push({ domain, capability });
    }
  }
  list(): EthicalPublisher[] {
    return [...this.publishers];
  }
  isRegistered(domain: string): boolean {
    return this.publishers.some(p => p.domain === domain);
  }
  clear(): void {
    this.publishers = [];
  }
}
