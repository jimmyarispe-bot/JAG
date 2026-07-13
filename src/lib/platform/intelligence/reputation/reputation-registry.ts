import type { ReputationRegistry as Contract } from "@/lib/platform/intelligence/reputation/contracts";
import type { ReputationPublisher } from "@/lib/platform/intelligence/reputation/types";

export class ReputationRegistryStore implements Contract {
  private publishers: ReputationPublisher[] = [];
  register(domain: string, capability: string) {
    if (!this.publishers.some(p => p.domain === domain && p.capability === capability)) {
      this.publishers.push({ domain, capability });
    }
  }
  list() { return [...this.publishers]; }
  isRegistered(domain: string) { return this.publishers.some(p => p.domain === domain); }
  clear() { this.publishers.length = 0; }
}

export { ReputationRegistryStore as ReputationRegistry };
