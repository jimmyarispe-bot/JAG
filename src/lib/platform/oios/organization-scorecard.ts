import type { OrganizationScorecard as Contract } from "@/lib/platform/oios/contracts";
import { clamp } from "@/lib/platform/oios/models";
import type { HealthIndex, MaturityAssessment, OiosBaseline, Scorecard } from "@/lib/platform/oios/types";
export class OrganizationScorecard implements Contract {
  constructor(private readonly now: () => Date = () => new Date()) {}
  build(health: HealthIndex, maturity: MaturityAssessment, baseline: OiosBaseline): Scorecard { const measures = { health: health.score, maturity: maturity.score, execution: baseline.executionScore, capability: baseline.capabilityScore }; return { overall: clamp(Object.values(measures).reduce((total, value) => total + value, 0) / 4), measures, generatedAt: this.now().toISOString() }; }
}
