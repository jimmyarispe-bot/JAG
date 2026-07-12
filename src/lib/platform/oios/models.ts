import { OIOS_INTELLIGENCE_DOMAINS, type DomainDescriptor, type OiosBaseline, type OiosHealthBand, type OiosMaturityLevel, type OiosPriorityBand } from "@/lib/platform/oios/types";
import type { OrganizationDNA, OrganizationStage } from "@/lib/platform/intelligence/organization-dna/types";

export function clamp(value: number, min = 0, max = 100): number { return Math.min(max, Math.max(min, value)); }
export function clamp01(value: number): number { return clamp(value, 0, 1); }
export function defaultOiosBaseline(): OiosBaseline { return { healthScore: 70, financialScore: 68, complianceScore: 70, riskScore: 30, executionScore: 60, capabilityScore: 60 }; }
export function deriveOiosBaseline(dna: OrganizationDNA | null, overrides?: Partial<OiosBaseline>): OiosBaseline {
  const base = defaultOiosBaseline();
  if (!dna) return { ...base, ...overrides };
  return { healthScore: clamp(dna.score.overall), financialScore: clamp(dna.readiness.dimensions.find((item) => item.key === "financial")?.score ?? base.financialScore), complianceScore: clamp(100 - dna.scoring.overallScore + dna.readiness.overallScore), riskScore: clamp(dna.swot.threats.length * 12), executionScore: clamp(dna.score.execution), capabilityScore: clamp(dna.score.readiness), ...overrides };
}
export function maturityFromScore(score: number): OiosMaturityLevel { if (score >= 85) return "optimizing"; if (score >= 70) return "managed"; if (score >= 55) return "defined"; if (score >= 35) return "emerging"; return "nascent"; }
export function healthBandFromScore(score: number): OiosHealthBand { if (score >= 85) return "thriving"; if (score >= 70) return "healthy"; if (score >= 50) return "stable"; if (score >= 30) return "at-risk"; return "critical"; }
export function priorityFromScore(score: number): OiosPriorityBand { if (score < 35) return "critical"; if (score < 50) return "high"; if (score < 65) return "medium"; if (score < 80) return "low"; return "monitor"; }
export function defaultRegisteredDomains(): DomainDescriptor[] {
  const active = new Set(["organization-dna", "organization-health", "financial", "founder", "executive", "executive-graph", "executive-decision", "predictive", "board-governance", "human-capital", "revenue"]);
  return OIOS_INTELLIGENCE_DOMAINS.map((domain, index) => ({
    domain,
    status: active.has(domain) ? "active" : "registered",
    dependencies:
      domain === "organization-dna"
        ? []
        : domain === "organization-health"
          ? ["organization-dna"]
          : domain === "human-capital"
            ? ["organization-dna", "organization-health"]
            : domain === "revenue"
              ? ["organization-dna", "financial", "human-capital"]
              : [],
    priority: index,
    description: `${domain} intelligence domain`,
  }));
}
export function stageIndex(stage: OrganizationStage): number { return ["idea", "startup", "operating", "growth", "turnaround", "acquisition", "exit"].indexOf(stage); }
export function previousStage(stage: OrganizationStage): OrganizationStage | null { const stages: OrganizationStage[] = ["idea", "startup", "operating", "growth", "turnaround", "acquisition", "exit"]; return stages[stageIndex(stage) - 1] ?? null; }
export function nextStage(stage: OrganizationStage): OrganizationStage | null { const stages: OrganizationStage[] = ["idea", "startup", "operating", "growth", "turnaround", "acquisition", "exit"]; return stage === "exit" ? null : stages[stageIndex(stage) + 1] ?? null; }
export const oiosModels = { clamp, clamp01, defaultOiosBaseline, deriveOiosBaseline, maturityFromScore, healthBandFromScore, priorityFromScore, defaultRegisteredDomains, stageIndex, previousStage, nextStage };
