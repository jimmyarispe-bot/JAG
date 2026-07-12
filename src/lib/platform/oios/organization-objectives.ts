import type { OrganizationObjectives as Contract } from "@/lib/platform/oios/contracts";
import type { ImprovementOpportunity, Objective } from "@/lib/platform/oios/types";
export class OrganizationObjectives implements Contract {
  constructor(private readonly createId: (prefix: string) => string = (prefix) => `${prefix}-${Date.now()}`) {}
  build(opportunities: ImprovementOpportunity[]): Objective[] { return opportunities.slice(0, 5).map((item) => ({ id: this.createId("objective"), title: item.title, target: `Improve ${item.domain} score above 80`, priority: item.priority })); }
}
