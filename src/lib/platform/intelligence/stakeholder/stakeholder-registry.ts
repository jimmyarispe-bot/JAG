import type { StakeholderRegistry as Contract } from "@/lib/platform/intelligence/stakeholder/contracts";
import type { StakeholderPublisher } from "@/lib/platform/intelligence/stakeholder/types";

export class StakeholderRegistryStore implements Contract {
  private publishers: StakeholderPublisher[] = [];
  register(domain: string, capability: string) {
    if (!this.publishers.some(p => p.domain === domain && p.capability === capability)) {
      this.publishers.push({ domain, capability });
    }
  }
  list() { return [...this.publishers]; }
  isRegistered(domain: string) { return this.publishers.some(p => p.domain === domain); }
  clear() { this.publishers.length = 0; }
}

export { StakeholderRegistryStore as StakeholderRegistry };
