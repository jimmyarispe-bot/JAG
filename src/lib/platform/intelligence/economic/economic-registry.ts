import type { EconomicRegistry as Contract } from "@/lib/platform/intelligence/economic/contracts";
import type { EconomicPublisher } from "@/lib/platform/intelligence/economic/types";

export class EconomicRegistryStore implements Contract {
  private publishers: EconomicPublisher[] = [];
  register(domain: string, capability: string) {
    if (!this.publishers.some(p => p.domain === domain && p.capability === capability)) {
      this.publishers.push({ domain, capability });
    }
  }
  list() { return [...this.publishers]; }
  isRegistered(domain: string) { return this.publishers.some(p => p.domain === domain); }
  clear() { this.publishers.length = 0; }
}

export { EconomicRegistryStore as EconomicRegistry };
