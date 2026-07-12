import type { GraphScope } from "@/lib/platform/intelligence/executive-graph/types";
import type { ImpactBaseline, ImpactConfidenceLevel, ImpactConfidenceScore, ImpactHealthStatus, ImpactLens, ImpactPriorityBand, ImpactRequest } from "@/lib/platform/intelligence/impact/types";
import { IMPACT_AREAS } from "@/lib/platform/intelligence/impact/types";

export const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
export function statusFromScore(score: number): ImpactHealthStatus { if (score >= 85) return "excellent"; if (score >= 70) return "healthy"; if (score >= 50) return "warning"; return "critical"; }
export function priorityFromScore(score: number): ImpactPriorityBand { if (score < 35) return "critical"; if (score < 50) return "high"; if (score < 65) return "medium"; if (score < 80) return "low"; return "monitor"; }
export function levelFromValue(value: number): ImpactConfidenceLevel { if (value >= .8) return "high"; if (value >= .55) return "medium"; if (value >= .3) return "low"; return "unknown"; }
export function buildConfidence(factors: Array<{ key: string; label: string; contribution: number }>): ImpactConfidenceScore { const value = Math.min(1, Math.max(0, factors.reduce((s, f) => s + f.contribution, 0) / Math.max(1, factors.length))); return { value, level: levelFromValue(value), factors }; }
export function buildLens(lens: ImpactLens): ImpactLens { return { outcomeAchieved: lens.outcomeAchieved, evidenceSupports: lens.evidenceSupports, baselineUsed: lens.baselineUsed, whatChanged: lens.whatChanged, confidenceLevel: lens.confidenceLevel, causeAttribution: lens.causeAttribution, goalsImproved: lens.goalsImproved, nextImprovement: lens.nextImprovement }; }
export const defaultCreateId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
export const defaultPeriodLabel = (now = new Date()) => `${now.getUTCFullYear()}-Q${Math.floor(now.getUTCMonth() / 3) + 1}`;
export const emptyImpactScope = (): GraphScope => ({ organizationId: null, schoolId: null });
const lightScore = (value: unknown, fallback: number) => typeof value === "number" ? (value <= 1 ? value * 100 : value) : fallback;
export function defaultImpactBaseline(): ImpactBaseline {
  return { organizationHealthScore: 72, executionScore: 68, areaScores: { mission: 70, customer: 68, employee: 66, student: 72, community: 64, financial: 69, grant: 63, program_effectiveness: 67, strategic_goal_achievement: 65, operational: 68, innovation: 66, long_term_organizational: 64 }, measurementMaturity: 62, outcomeMaturity: 65, roiMaturity: 58, knowledgeMaturity: 63, evidenceCoverage: 61 };
}
export function deriveImpactBaseline(request: ImpactRequest): ImpactBaseline {
  const base = defaultImpactBaseline();
  const health = request.oiosResult?.health.score ?? request.graphInput?.organizationHealth?.overallScore ?? base.organizationHealthScore;
  const sources: Record<string, unknown> = {
    customer: request.customerResult?.satisfactionScore?.value ?? request.customerResult?.healthScore?.value,
    employee: request.humanCapitalResult?.workforceScore?.value ?? request.humanCapitalResult?.healthScore?.value,
    financial: request.revenueResult?.revenueScore?.value ?? request.revenueResult?.healthScore?.value,
    grant: request.fundingResult?.fundingScore?.value ?? request.fundingResult?.healthScore?.value,
    operational: request.operationsResult?.operationsScore?.value ?? request.operationsResult?.healthScore?.value,
    innovation: request.innovationResult?.innovationScore?.value ?? request.innovationResult?.healthScore?.value,
  };
  const areaScores = { ...base.areaScores };
  for (const area of IMPACT_AREAS) areaScores[area] = clamp(lightScore(sources[area], areaScores[area]) * .7 + lightScore(health, 72) * .3);
  areaScores.mission = clamp((areaScores.student + areaScores.community + lightScore(health, 72)) / 3);
  areaScores.student = clamp((areaScores.customer + areaScores.mission) / 2 + 3);
  areaScores.program_effectiveness = clamp((areaScores.student + areaScores.operational) / 2);
  areaScores.strategic_goal_achievement = clamp((areaScores.mission + areaScores.operational + areaScores.financial) / 3);
  areaScores.long_term_organizational = clamp((areaScores.mission + areaScores.employee + areaScores.financial + areaScores.innovation) / 4);
  return { ...base, organizationHealthScore: clamp(lightScore(health, 72)), executionScore: clamp(request.oiosResult?.baseline.executionScore ?? base.executionScore), areaScores, measurementMaturity: clamp(lightScore(request.documentResult?.healthScore?.value, base.measurementMaturity)), outcomeMaturity: clamp((areaScores.mission + areaScores.program_effectiveness) / 2), roiMaturity: clamp((areaScores.financial + areaScores.grant) / 2), knowledgeMaturity: clamp(lightScore(request.knowledgeResult?.contributionScore?.value ?? request.knowledgeResult?.healthScore?.value, base.knowledgeMaturity)), evidenceCoverage: clamp(lightScore(request.knowledgeResult?.coverageScore?.value ?? request.documentResult?.complianceScore?.value, base.evidenceCoverage)), ...request.baselineOverrides };
}
export const impactModels = { clamp, statusFromScore, priorityFromScore, levelFromValue, buildConfidence, buildLens, defaultCreateId, defaultPeriodLabel, emptyImpactScope, defaultImpactBaseline, deriveImpactBaseline };
export class ImpactModels { static clamp = clamp; static buildLens = buildLens; static derive = deriveImpactBaseline; static baseline = defaultImpactBaseline; }
