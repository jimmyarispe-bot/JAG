import type { BehavioralRegistry as Contract } from "@/lib/platform/intelligence/behavioral/contracts";
import type { BehavioralPublisher } from "@/lib/platform/intelligence/behavioral/types";

export class BehavioralRegistryStore implements Contract {
  private publishers: BehavioralPublisher[] = [];
  register(domain: string, capability: string) {
    if (!this.publishers.some(p => p.domain === domain && p.capability === capability)) {
      this.publishers.push({ domain, capability });
    }
  }
  list() { return [...this.publishers]; }
  isRegistered(domain: string) { return this.publishers.some(p => p.domain === domain); }
  clear() { this.publishers.length = 0; }
}

export { BehavioralRegistryStore as BehavioralRegistry };
