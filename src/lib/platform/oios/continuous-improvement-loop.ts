import type { ContinuousImprovementLoop as Contract } from "@/lib/platform/oios/contracts";
import type { HealthIndex, ImprovementCycle, ImprovementOpportunity } from "@/lib/platform/oios/types";
export class ContinuousImprovementLoop implements Contract {
  constructor(private readonly createId: (prefix: string) => string = (prefix) => `${prefix}-${Date.now()}`, private readonly now: () => Date = () => new Date()) {}
  run(opportunities: ImprovementOpportunity[], health: HealthIndex): ImprovementCycle { return { id: this.createId("cycle"), status: "learned", opportunities: opportunities.map((item) => ({ ...item })), actions: opportunities.slice(0, 3).map((item) => `Assign owner and 90-day measure for ${item.title}.`), measuredScore: health.score, learnedAt: this.now().toISOString(), stages: ["assess", "prioritize", "plan", "execute", "measure", "learn"] }; }
}
