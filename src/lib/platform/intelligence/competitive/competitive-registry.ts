import type { CompetitiveRegistry as Contract } from "@/lib/platform/intelligence/competitive/contracts";
import type { CompetitivePublisher } from "@/lib/platform/intelligence/competitive/types";

export class CompetitiveRegistryStore implements Contract {
  private publishers: CompetitivePublisher[] = [];
  register(domain: string, capability: string) {
    if (!this.publishers.some(p => p.domain === domain && p.capability === capability)) {
      this.publishers.push({ domain, capability });
    }
  }
  list() { return [...this.publishers]; }
  isRegistered(domain: string) { return this.publishers.some(p => p.domain === domain); }
  clear() { this.publishers.length = 0; }
}

export { CompetitiveRegistryStore as CompetitiveRegistry };
