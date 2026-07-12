/**
 * Board & Governance Intelligence — ExecutiveBriefGenerator (Sprint 029).
 */

import type { ExecutiveBriefGenerator as ExecutiveBriefGeneratorContract } from "@/lib/platform/intelligence/board-governance/contracts";
import { defaultPeriodLabel } from "@/lib/platform/intelligence/board-governance/models";
import type {
  BoardKpi,
  BoardResolution,
  ComplianceItem,
  ExecutiveBrief,
  GovernanceBaseline,
  GovernanceConfidenceScore,
  GovernanceRequest,
  RiskRegisterEntry,
  StrategicInitiative,
} from "@/lib/platform/intelligence/board-governance/types";

export interface ExecutiveBriefGeneratorDependencies {
  createId?: (prefix: string) => string;
}

/**
 * ExecutiveBriefGenerator — short-form board / leadership briefing.
 */
export class ExecutiveBriefGeneratorEngine
  implements ExecutiveBriefGeneratorContract
{
  private readonly createId: (prefix: string) => string;

  constructor(dependencies: ExecutiveBriefGeneratorDependencies = {}) {
    this.createId =
      dependencies.createId ??
      ((prefix) =>
        `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  }

  generate(input: {
    request: GovernanceRequest;
    baseline: GovernanceBaseline;
    kpis: BoardKpi[];
    risks: RiskRegisterEntry[];
    initiatives: StrategicInitiative[];
    compliance: ComplianceItem[];
    resolutions: BoardResolution[];
    confidence: GovernanceConfidenceScore;
    now: Date;
  }): ExecutiveBrief {
    const period =
      input.request.periodLabel ?? defaultPeriodLabel(input.now);
    const topRisk = input.risks[0];
    const topInitiative = input.initiatives[0];
    const openResolutions = input.resolutions.filter(
      (r) => r.status !== "completed" && r.status !== "rescinded"
    );

    const headline = topRisk
      ? `Board briefing: watch ${topRisk.title}`
      : `Board briefing ready for ${period}`;

    return {
      id: this.createId("brief"),
      title: "Executive Briefing",
      generatedAt: input.now.toISOString(),
      periodLabel: period,
      headline,
      situation: `Organization health ${input.baseline.organizationHealthScore}; executive KPI ${input.baseline.executiveKpi}. ${
        input.request.question
          ? `Focus: ${input.request.question}`
          : "Standard board oversight cycle."
      }`,
      financialSummary: `Revenue ${input.baseline.revenue}, cash flow ${input.baseline.cashFlow}, expense ${input.baseline.expense}, financial health ${input.baseline.financialHealthScore}.`,
      missionSummary: `Mission score ${input.baseline.missionScore} with enrollment at ${input.baseline.enrollment}.`,
      riskSummary: topRisk
        ? `Top risk: ${topRisk.title} (${topRisk.heat}). ${input.risks.length} risks on register.`
        : "No material risks flagged.",
      initiativeSummary: topInitiative
        ? `${input.initiatives.length} initiatives tracked; lead initiative "${topInitiative.title}" at ${topInitiative.progressPct}%.`
        : "No strategic initiatives supplied.",
      decisionsNeeded: [
        ...openResolutions.slice(0, 2).map((r) => `Advance resolution: ${r.title}`),
        ...(topRisk ? [`Confirm mitigation owner for ${topRisk.title}`] : []),
      ].slice(0, 4),
      watchItems: [
        ...input.kpis
          .filter((k) => k.status === "critical" || k.status === "high")
          .map((k) => k.label),
        ...input.compliance
          .filter((c) => c.status !== "compliant")
          .map((c) => c.area),
      ].slice(0, 5),
      confidence: input.confidence,
    };
  }
}

/** Alias matching Sprint 029 naming. */
export { ExecutiveBriefGeneratorEngine as ExecutiveBriefGenerator };
