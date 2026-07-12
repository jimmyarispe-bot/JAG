import type { OrganizationMaturityModel as Contract } from "@/lib/platform/oios/contracts";
import { maturityFromScore, clamp } from "@/lib/platform/oios/models";
import type { CapabilityRecord, MaturityAssessment } from "@/lib/platform/oios/types";
export class OrganizationMaturityModel implements Contract {
  assess(capabilities: CapabilityRecord[]): MaturityAssessment { const dimensions = Object.fromEntries(capabilities.map((item) => [item.domain, item.score])); const score = clamp(capabilities.reduce((total, item) => total + item.score, 0) / Math.max(capabilities.length, 1)); return { score, level: maturityFromScore(score), dimensions }; }
}
