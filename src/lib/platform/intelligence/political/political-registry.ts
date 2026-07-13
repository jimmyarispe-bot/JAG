import type { PoliticalRegistry as Contract } from "@/lib/platform/intelligence/political/contracts";
import type { PoliticalPublisher } from "@/lib/platform/intelligence/political/types";

export class PoliticalRegistryStore implements Contract {
  private publishers: PoliticalPublisher[] = [];
  register(domain: string, capability: string) {
    if (!this.publishers.some(p => p.domain === domain && p.capability === capability)) {
      this.publishers.push({ domain, capability });
    }
  }
  list() { return [...this.publishers]; }
  isRegistered(domain: string) { return this.publishers.some(p => p.domain === domain); }
  clear() { this.publishers.length = 0; }
}

export { PoliticalRegistryStore as PoliticalRegistry };
