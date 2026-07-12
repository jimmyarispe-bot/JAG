import type { OrganizationalDigitalTwin as Contract } from "@/lib/platform/oios/contracts";
import type { DigitalTwinSnapshot, OiosScope, OrganizationalState } from "@/lib/platform/oios/types";
import type { OrganizationDNA } from "@/lib/platform/intelligence/organization-dna/types";
export class OrganizationalDigitalTwin implements Contract {
  constructor(private readonly now: () => Date = () => new Date(), private readonly createId: (prefix: string) => string = (prefix) => `${prefix}-${Date.now()}`) {}
  snapshot(input: { scope: OiosScope; state: OrganizationalState; signals: Record<string, number>; dna: OrganizationDNA | null }): DigitalTwinSnapshot {
    return { id: this.createId("twin"), scope: { ...input.scope }, lifecycle: input.state.lifecycle, state: { ...input.state, activeDomains: [...input.state.activeDomains], risks: [...input.state.risks] }, domainSignals: { ...input.signals }, updatedAt: this.now().toISOString(), metadata: input.dna ? { dnaId: input.dna.id } : {} };
  }
}
