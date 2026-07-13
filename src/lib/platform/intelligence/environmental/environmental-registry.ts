import type { EnvironmentalRegistry as Contract } from "@/lib/platform/intelligence/environmental/contracts";
import type { EnvironmentalPublisher } from "@/lib/platform/intelligence/environmental/types";

export class EnvironmentalRegistryStore implements Contract {
  private publishers: EnvironmentalPublisher[] = [];
  register(domain: string, capability: string) {
    if (!this.publishers.some(p => p.domain === domain && p.capability === capability)) {
      this.publishers.push({ domain, capability });
    }
  }
  list() { return [...this.publishers]; }
  isRegistered(domain: string) { return this.publishers.some(p => p.domain === domain); }
  clear() { this.publishers.length = 0; }
}

export { EnvironmentalRegistryStore as EnvironmentalRegistry };
