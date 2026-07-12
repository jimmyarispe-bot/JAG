/** Improvement analysis suite (Sprint 036). */
import type * as C from "@/lib/platform/intelligence/organizational-improvement/contracts";
import {
  buildConfidence,
  buildLenses,
  clamp,
  clamp01,
  priorityFromScore,
} from "@/lib/platform/intelligence/organizational-improvement/models";
import type * as T from "@/lib/platform/intelligence/organizational-improvement/types";

const lenses = buildLenses({
  whyNow: "Analysis re-scores why each improvement matters now against current baselines.",
  expectedRoi: "Financial return is weighed against implementation cost and capacity.",
  missionImpact: "Mission outcomes remain co-equal with financial and operational gains.",
  financialImpact: "Cash, margin, and funding posture effects are quantified per improvement.",
  peopleImpact: "Workforce and leadership bandwidth impacts are scored explicitly.",
  implementationEffort: "Effort and resource needs determine sequencing feasibility.",
  risk: "Risk reduction and residual delivery risk are measured together.",
  confidence: "Confidence reflects evidence quality, DNA fit, and execution readiness.",
  dependencies: "Blocking dependencies shape order of attack.",
  timeToValue: "Time-to-value drives quick-win versus strategic placement.",
});

export class PriorityScoring implements C.PriorityScoring {
  score({ baseline, records }: Parameters<C.PriorityScoring["score"]>[0]): T.ImprovementAnalysisResult["priority"] {
    return records.map((record) => {
      const priorityScore = clamp(
        record.score * 0.45 +
          record.expectedRoi * 8 +
          record.riskReduction * 0.15 +
          baseline.executionReadiness * 0.15 +
          (100 - Math.min(100, record.expectedTimelineDays / 4)) * 0.1
      );
      return {
        improvementId: record.id,
        priorityScore,
        band: priorityFromScore(priorityScore),
        narrative: `${record.title} priority is ${priorityFromScore(priorityScore)} at ${Math.round(priorityScore)}.`,
      };
    });
  }
}

export class ImpactScoring implements C.ImpactScoring {
  analyze({ baseline, records }: Parameters<C.ImpactScoring["analyze"]>[0]): T.ImprovementAnalysisResult["impact"] {
    return records.map((record) => {
      const financial = clamp((record.estimatedFinancialImpact / Math.max(1, baseline.annualRevenue)) * 100);
      const mission = clamp(record.estimatedMissionImpact);
      const people = clamp(record.estimatedPeopleImpact);
      const organizational = clamp((financial + mission + people + baseline.organizationHealthScore) / 4);
      return {
        improvementId: record.id,
        financial,
        mission,
        people,
        organizational,
        narrative: `${record.title} impact — financial ${Math.round(financial)}, mission ${Math.round(mission)}, people ${Math.round(people)}, organizational ${Math.round(organizational)}.`,
      };
    });
  }
}

export class MissionAlignmentAnalysis implements C.MissionAlignmentAnalysis {
  analyze({
    baseline,
    records,
  }: Parameters<C.MissionAlignmentAnalysis["analyze"]>[0]): T.ImprovementAnalysisResult["missionAlignment"] {
    return records.map((record) => {
      const alignment = clamp(
        (record.estimatedMissionImpact * 0.45 +
          record.organizationalDnaAlignment.missionFit * 0.35 +
          baseline.missionAlignment * 0.2)
      );
      return {
        improvementId: record.id,
        alignment,
        narrative: `${record.title} mission alignment is ${Math.round(alignment)}.`,
      };
    });
  }
}

export class FinancialImpactAnalysis implements C.FinancialImpactAnalysis {
  analyze({
    records,
  }: Parameters<C.FinancialImpactAnalysis["analyze"]>[0]): T.ImprovementAnalysisResult["financialImpact"] {
    return records.map((record) => {
      const roi =
        record.implementationCost > 0
          ? (record.estimatedFinancialImpact - record.implementationCost) / record.implementationCost
          : record.expectedRoi;
      return {
        improvementId: record.id,
        financialImpact: record.estimatedFinancialImpact,
        roi,
        narrative: `${record.title} projects $${record.estimatedFinancialImpact.toLocaleString()} financial impact at ${(roi * 100).toFixed(0)}% ROI.`,
      };
    });
  }
}

export class RiskReductionAnalysis implements C.RiskReductionAnalysis {
  analyze({
    records,
  }: Parameters<C.RiskReductionAnalysis["analyze"]>[0]): T.ImprovementAnalysisResult["riskReduction"] {
    return records.map((record) => ({
      improvementId: record.id,
      riskReduction: record.riskReduction,
      factors: record.risks,
      narrative: `${record.title} reduces risk by ${Math.round(record.riskReduction)} with ${record.risks.length} tracked factors.`,
    }));
  }
}

export class TimeToValueAnalysis implements C.TimeToValueAnalysis {
  analyze({
    records,
  }: Parameters<C.TimeToValueAnalysis["analyze"]>[0]): T.ImprovementAnalysisResult["timeToValue"] {
    return records.map((record) => ({
      improvementId: record.id,
      days: record.expectedTimelineDays,
      band: priorityFromScore(100 - Math.min(100, record.expectedTimelineDays / 4)),
      narrative: `${record.title} can realize value in approximately ${record.expectedTimelineDays} days.`,
    }));
  }
}

export class ResourceRequirementsAnalysis implements C.ResourceRequirementsAnalysis {
  analyze({
    records,
  }: Parameters<C.ResourceRequirementsAnalysis["analyze"]>[0]): T.ImprovementAnalysisResult["resources"] {
    return records.map((record) => {
      const resources = record.requiredResources.length
        ? record.requiredResources
        : [
            {
              role: "Improvement owner",
              effortHours: Math.round(record.expectedTimelineDays * 2.2),
              skills: ["execution"],
              budget: Math.round(record.implementationCost * 0.35),
            },
          ];
      const totalBudget = resources.reduce((sum, item) => sum + item.budget, 0);
      return {
        improvementId: record.id,
        resources,
        totalBudget,
        narrative: `${record.title} requires $${totalBudget.toLocaleString()} in direct resource budget.`,
      };
    });
  }
}

export class OrganizationalCapacityAnalysis implements C.OrganizationalCapacityAnalysis {
  analyze({
    baseline,
    records,
  }: Parameters<C.OrganizationalCapacityAnalysis["analyze"]>[0]): T.ImprovementAnalysisResult["capacity"] {
    return records.map((record) => {
      const load = clamp(record.implementationEffort);
      const capacityFit = clamp(baseline.organizationalCapacity - load * 0.35 + 40);
      const constrained = capacityFit < 55 || record.expectedTimelineDays > 180;
      return {
        improvementId: record.id,
        capacityFit,
        constrained,
        narrative: constrained
          ? `${record.title} is capacity-constrained (fit ${Math.round(capacityFit)}).`
          : `${record.title} fits current capacity (fit ${Math.round(capacityFit)}).`,
      };
    });
  }
}

export class DependencyResolution implements C.DependencyResolution {
  analyze({
    records,
  }: Parameters<C.DependencyResolution["analyze"]>[0]): T.ImprovementAnalysisResult["dependencies"] {
    return records.map((record) => {
      const dependencies = record.dependencies.length
        ? record.dependencies
        : [
            {
              key: "capacity",
              label: "Available delivery capacity",
              blocking: record.expectedTimelineDays > 180,
              domain: record.sourceDomain,
            },
          ];
      return {
        improvementId: record.id,
        dependencies,
        blocked: dependencies.some((d) => d.blocking),
        narrative: `${record.title} has ${dependencies.length} tracked dependencies.`,
      };
    });
  }
}

export class ImprovementConfidenceAnalysis implements C.ImprovementConfidenceAnalysis {
  score({
    baseline,
    records,
  }: Parameters<C.ImprovementConfidenceAnalysis["score"]>[0]): T.ImprovementAnalysisResult["confidence"] {
    return records.map((record) => {
      const confidence = buildConfidence([
        { key: "baseline", label: "Organizational baseline", contribution: baseline.organizationHealthScore / 100 },
        { key: "evidence", label: "Improvement evidence", contribution: clamp01(record.confidence) },
        { key: "execution", label: "Execution readiness", contribution: baseline.executionReadiness / 100 },
        { key: "dna", label: "DNA alignment", contribution: record.organizationalDnaAlignment.readinessFit / 100 },
      ]);
      return {
        improvementId: record.id,
        confidence,
        narrative: `${record.title} confidence is ${confidence.level} (${Math.round(confidence.value * 100)}%).`,
      };
    });
  }
}

export class ImprovementAnalysisEngine implements C.ImprovementAnalysisEngine {
  private readonly priority: C.PriorityScoring;
  private readonly impact: C.ImpactScoring;
  private readonly mission: C.MissionAlignmentAnalysis;
  private readonly financial: C.FinancialImpactAnalysis;
  private readonly risk: C.RiskReductionAnalysis;
  private readonly timeToValue: C.TimeToValueAnalysis;
  private readonly resources: C.ResourceRequirementsAnalysis;
  private readonly capacity: C.OrganizationalCapacityAnalysis;
  private readonly dependencies: C.DependencyResolution;
  private readonly confidence: C.ImprovementConfidenceAnalysis;

  constructor(d: C.ImprovementDependencies = {}) {
    this.priority = d.priorityScoring ?? new PriorityScoring();
    this.impact = d.impactScoring ?? new ImpactScoring();
    this.mission = d.missionAlignment ?? new MissionAlignmentAnalysis();
    this.financial = d.financialImpact ?? new FinancialImpactAnalysis();
    this.risk = d.riskReduction ?? new RiskReductionAnalysis();
    this.timeToValue = d.timeToValue ?? new TimeToValueAnalysis();
    this.resources = d.resourceRequirements ?? new ResourceRequirementsAnalysis();
    this.capacity = d.organizationalCapacity ?? new OrganizationalCapacityAnalysis();
    this.dependencies = d.dependencyResolution ?? new DependencyResolution();
    this.confidence = d.improvementConfidence ?? new ImprovementConfidenceAnalysis();
  }

  analyze(input: Parameters<C.ImprovementAnalysisEngine["analyze"]>[0]): T.ImprovementAnalysisResult {
    const { baseline, records, dnaAlignment } = input;
    const priority = this.priority.score({ baseline, now: input.now, records });
    const priorityById = new Map(priority.map((p) => [p.improvementId, p]));
    const confidenceRows = this.confidence.score({ baseline, now: input.now, records });
    const confidenceById = new Map(confidenceRows.map((c) => [c.improvementId, c]));

    const scored = [...records]
      .map((record) => {
        const p = priorityById.get(record.id);
        const c = confidenceById.get(record.id);
        const score = clamp(p?.priorityScore ?? record.score);
        const alignment = dnaAlignment
          ? {
              ...record.organizationalDnaAlignment,
              stageFit: clamp((record.organizationalDnaAlignment.stageFit + dnaAlignment.stageFit) / 2),
              missionFit: clamp((record.organizationalDnaAlignment.missionFit + dnaAlignment.missionFit) / 2),
              businessModelFit: clamp(
                (record.organizationalDnaAlignment.businessModelFit + dnaAlignment.businessModelFit) / 2
              ),
              readinessFit: clamp(
                (record.organizationalDnaAlignment.readinessFit + dnaAlignment.readinessFit) / 2
              ),
            }
          : record.organizationalDnaAlignment;
        return {
          ...record,
          score,
          priority: p?.band ?? priorityFromScore(score),
          confidence: c?.confidence.value ?? record.confidence,
          organizationalDnaAlignment: alignment,
        };
      })
      .sort((a, b) => b.score - a.score);

    const common = { baseline, now: input.now, records: scored };
    return {
      scored,
      priority: this.priority.score(common),
      impact: this.impact.analyze(common),
      missionAlignment: this.mission.analyze(common),
      financialImpact: this.financial.analyze(common),
      riskReduction: this.risk.analyze(common),
      timeToValue: this.timeToValue.analyze(common),
      resources: this.resources.analyze(common),
      capacity: this.capacity.analyze(common),
      dependencies: this.dependencies.analyze(common),
      confidence: this.confidence.score(common),
      lenses,
      narrative: `${scored.length} improvements were re-scored across priority, impact, mission, financial, risk, time-to-value, resources, capacity, dependencies, and confidence.`,
    };
  }
}
