import type { OrganizationCapabilitiesRegistry as Contract } from "@/lib/platform/oios/contracts";
import { maturityFromScore } from "@/lib/platform/oios/models";
import type { CapabilityRecord, OiosBaseline } from "@/lib/platform/oios/types";
export class OrganizationCapabilitiesRegistry implements Contract {
  constructor(private readonly createId: (prefix: string) => string = (prefix) => `${prefix}-${Date.now()}`) {}
  assess(baseline: OiosBaseline): CapabilityRecord[] { return [["operations", "Operating discipline", baseline.executionScore], ["organization-health", "Organizational health", baseline.healthScore], ["financial", "Financial stewardship", baseline.financialScore], ["compliance", "Governance compliance", baseline.complianceScore], ["human-capital", "Capability development", baseline.capabilityScore]].map(([domain, name, score]) => ({ id: this.createId("capability"), domain: domain as CapabilityRecord["domain"], name: name as string, score: score as number, maturity: maturityFromScore(score as number), evidence: [`Baseline score: ${score}`] })); }
}
