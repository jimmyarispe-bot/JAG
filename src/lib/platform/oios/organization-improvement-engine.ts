import type { OrganizationImprovementEngine as Contract } from "@/lib/platform/oios/contracts";
import { priorityFromScore } from "@/lib/platform/oios/models";
import type { CapabilityRecord, ImprovementOpportunity } from "@/lib/platform/oios/types";
export class OrganizationImprovementEngine implements Contract {
  constructor(private readonly createId: (prefix: string) => string = (prefix) => `${prefix}-${Date.now()}`) {}
  prioritize(capabilities: CapabilityRecord[]): ImprovementOpportunity[] { return capabilities.filter((capability) => capability.score < 80).sort((a, b) => a.score - b.score).map((capability) => ({ id: this.createId("opportunity"), title: `Strengthen ${capability.name}`, domain: capability.domain, score: capability.score, priority: priorityFromScore(capability.score), recommendation: `Establish a measurable improvement plan for ${capability.name.toLowerCase()}.` })); }
}
