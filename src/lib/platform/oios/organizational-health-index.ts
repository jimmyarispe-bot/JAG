import type { OrganizationalHealthIndex as Contract } from "@/lib/platform/oios/contracts";
import { healthBandFromScore, clamp } from "@/lib/platform/oios/models";
import type { HealthIndex, OiosBaseline } from "@/lib/platform/oios/types";
export class OrganizationalHealthIndex implements Contract {
  assess(baseline: OiosBaseline): HealthIndex { const dimensions = { organizational: baseline.healthScore, financial: baseline.financialScore, compliance: baseline.complianceScore, risk: 100 - baseline.riskScore, execution: baseline.executionScore }; const score = clamp(Object.values(dimensions).reduce((total, value) => total + value, 0) / Object.keys(dimensions).length); return { score, band: healthBandFromScore(score), dimensions }; }
}
