import type { ImpactRegistry as Contract } from "@/lib/platform/intelligence/impact/contracts";
import type { ImpactPublisher } from "@/lib/platform/intelligence/impact/types";
export class ImpactRegistryStore implements Contract {
  private publishers: ImpactPublisher[] = [];
  register(domain: string, capability: string) { if (!this.publishers.some(p => p.domain === domain && p.capability === capability)) this.publishers.push({ domain, capability }); }
  list() { return [...this.publishers]; } isRegistered(domain: string) { return this.publishers.some(p => p.domain === domain); } clear() { this.publishers.length = 0; }
}
export { ImpactRegistryStore as ImpactRegistry };
