import type { OrganizationalContext as Contract } from "@/lib/platform/oios/contracts";
import type { OiosBaseline, OiosScope, OrganizationalContextSnapshot, OrganizationalState } from "@/lib/platform/oios/types";
import type { OrganizationDNA } from "@/lib/platform/intelligence/organization-dna/types";
export class OrganizationalContext implements Contract {
  constructor(private readonly now: () => Date = () => new Date()) {}
  create(input: { scope: OiosScope; baseline: OiosBaseline; state: OrganizationalState; dna: OrganizationDNA | null }): OrganizationalContextSnapshot { return { scope: { ...input.scope }, generatedAt: this.now().toISOString(), baseline: { ...input.baseline }, state: { ...input.state, activeDomains: [...input.state.activeDomains], risks: [...input.state.risks] }, dna: input.dna, metadata: {} }; }
}
