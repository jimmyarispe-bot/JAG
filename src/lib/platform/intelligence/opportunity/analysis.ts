/** Opportunity analysis suite (Sprint 035). */
import type * as C from "@/lib/platform/intelligence/opportunity/contracts";
import { buildConfidence, buildLenses, clamp, clamp01, priorityFromScore } from "@/lib/platform/intelligence/opportunity/models";
import type * as T from "@/lib/platform/intelligence/opportunity/types";

const lenses = buildLenses({
  organizationalHealth: "Analysis quantifies how each opportunity strengthens the organization.",
  financialSustainability: "ROI and cost profiles are scored against durable sustainability.",
  missionImpact: "Mission impact is measured alongside financial return.",
  longTermValue: "Strategic alignment and dependency risk protect long-term value.",
  timeToValue: "Time-to-value and resource needs determine sequencing.",
});

export class OpportunityScoring implements C.OpportunityScoring {
  score({ baseline, records }: Parameters<C.OpportunityScoring["score"]>[0]): T.OpportunityExchangeRecord[] {
    return records
      .map((record) => {
        const readinessBoost = baseline.executionReadiness / 200;
        const missionBoost = (record.estimatedMissionImpact / 100) * 0.15;
        const score = clamp(record.score * (0.85 + readinessBoost) + missionBoost * 100 * 0.1 + record.roi * 4);
        return { ...record, score, priority: priorityFromScore(score) };
      })
      .sort((a, b) => b.score - a.score);
  }
}

export class ROIAnalysis implements C.ROIAnalysis {
  analyze({ records }: Parameters<C.ROIAnalysis["analyze"]>[0]): T.OpportunityAnalysisResult["roi"] {
    return records.map((record) => {
      const roi = record.implementationCost > 0 ? (record.estimatedFinancialImpact - record.implementationCost) / record.implementationCost : record.roi;
      const paybackDays = Math.max(30, Math.round(record.expectedTimelineDays * (record.implementationCost / Math.max(1, record.estimatedFinancialImpact))));
      return {
        opportunityId: record.id,
        roi,
        paybackDays,
        narrative: `${record.title} projects ${(roi * 100).toFixed(0)}% ROI with ~${paybackDays}-day payback.`,
      };
    });
  }
}

export class ImpactAnalysis implements C.ImpactAnalysis {
  analyze({ baseline, records }: Parameters<C.ImpactAnalysis["analyze"]>[0]): T.OpportunityAnalysisResult["impact"] {
    return records.map((record) => {
      const financial = clamp((record.estimatedFinancialImpact / Math.max(1, baseline.annualRevenue)) * 100);
      const mission = clamp(record.estimatedMissionImpact);
      const organizational = clamp((financial + mission + baseline.organizationHealthScore) / 3);
      return {
        opportunityId: record.id,
        financial,
        mission,
        organizational,
        narrative: `${record.title} delivers ${Math.round(financial)} financial, ${Math.round(mission)} mission, and ${Math.round(organizational)} organizational impact.`,
      };
    });
  }
}

export class RiskAnalysis implements C.RiskAnalysis {
  analyze({ baseline, records }: Parameters<C.RiskAnalysis["analyze"]>[0]): T.OpportunityAnalysisResult["risk"] {
    return records.map((record) => {
      const executionRisk = clamp01(1 - baseline.executionReadiness / 100);
      const costRisk = clamp01(record.implementationCost / Math.max(1, record.estimatedFinancialImpact));
      const timelineRisk = clamp01(record.expectedTimelineDays / 540);
      const riskScore = clamp((executionRisk * 35 + costRisk * 35 + timelineRisk * 30) * 100);
      const factors: T.OpportunityRiskFactor[] = [
        { key: "execution", label: "Execution capacity", score: executionRisk * 100, mitigation: "Stage delivery and assign accountable owners." },
        { key: "cost", label: "Implementation cost", score: costRisk * 100, mitigation: "Phase investment and gate spend on proof points." },
        { key: "timeline", label: "Time-to-value", score: timelineRisk * 100, mitigation: "Sequence quick wins ahead of long-cycle bets." },
      ];
      return {
        opportunityId: record.id,
        riskScore,
        factors,
        narrative: `${record.title} carries a ${Math.round(riskScore)} composite risk score.`,
      };
    });
  }
}

export class ConfidenceScoring implements C.ConfidenceScoring {
  score({ baseline, records }: Parameters<C.ConfidenceScoring["score"]>[0]): T.OpportunityAnalysisResult["confidence"] {
    return records.map((record) => {
      const confidence = buildConfidence([
        { key: "baseline", label: "Organizational baseline", contribution: baseline.organizationHealthScore / 100 },
        { key: "evidence", label: "Opportunity evidence", contribution: record.confidence },
        { key: "execution", label: "Execution readiness", contribution: baseline.executionReadiness / 100 },
        { key: "dna", label: "DNA alignment", contribution: record.organizationalDnaAlignment.readinessFit / 100 },
      ]);
      return {
        opportunityId: record.id,
        confidence,
        narrative: `${record.title} confidence is ${confidence.level} (${Math.round(confidence.value * 100)}%).`,
      };
    });
  }
}

export class DependencyAnalysis implements C.DependencyAnalysis {
  analyze({ records }: Parameters<C.DependencyAnalysis["analyze"]>[0]): T.OpportunityAnalysisResult["dependencies"] {
    return records.map((record) => {
      const dependencies = record.dependencies.length
        ? record.dependencies
        : [
            {
              key: "capacity",
              label: "Available delivery capacity",
              blocking: record.expectedTimelineDays > 180,
              domain: "human-capital" as const,
            },
          ];
      return {
        opportunityId: record.id,
        dependencies,
        blocked: dependencies.some((d) => d.blocking),
        narrative: `${record.title} has ${dependencies.length} tracked dependencies.`,
      };
    });
  }
}

export class ResourceRequirements implements C.ResourceRequirements {
  analyze({ records }: Parameters<C.ResourceRequirements["analyze"]>[0]): T.OpportunityAnalysisResult["resources"] {
    return records.map((record) => {
      const resources = record.requiredResources.length
        ? record.requiredResources
        : [
            {
              role: "Opportunity owner",
              effortHours: Math.round(record.expectedTimelineDays * 2.5),
              skills: ["execution", "stakeholder management"],
              budget: Math.round(record.implementationCost * 0.35),
            },
            {
              role: "Specialist support",
              effortHours: Math.round(record.expectedTimelineDays * 1.2),
              skills: [record.category.replace(/_/g, " ")],
              budget: Math.round(record.implementationCost * 0.25),
            },
          ];
      const totalBudget = resources.reduce((sum, item) => sum + item.budget, 0);
      return {
        opportunityId: record.id,
        resources,
        totalBudget,
        narrative: `${record.title} requires $${totalBudget.toLocaleString()} in direct resource budget.`,
      };
    });
  }
}

export class TimeToValueAnalysis implements C.TimeToValueAnalysis {
  analyze({ records }: Parameters<C.TimeToValueAnalysis["analyze"]>[0]): T.OpportunityAnalysisResult["timeToValue"] {
    return records.map((record) => ({
      opportunityId: record.id,
      days: record.expectedTimelineDays,
      band: priorityFromScore(100 - Math.min(100, record.expectedTimelineDays / 4)),
      narrative: `${record.title} can realize value in approximately ${record.expectedTimelineDays} days.`,
    }));
  }
}

export class StrategicAlignment implements C.StrategicAlignment {
  analyze({
    records,
    dnaAlignment,
  }: Parameters<C.StrategicAlignment["analyze"]>[0]): T.OpportunityAnalysisResult["strategicAlignment"] {
    return records.map((record) => {
      const alignment = record.organizationalDnaAlignment ??
        dnaAlignment ?? {
          stageFit: 70,
          missionFit: 70,
          businessModelFit: 70,
          readinessFit: 70,
          narrative: "Default strategic alignment applied.",
        };
      return {
        opportunityId: record.id,
        alignment,
        narrative: `${record.title} strategic alignment: ${alignment.narrative}`,
      };
    });
  }
}

export class OpportunityAnalysisEngine implements C.OpportunityAnalysisEngine {
  private readonly scoring: C.OpportunityScoring;
  private readonly roi: C.ROIAnalysis;
  private readonly impact: C.ImpactAnalysis;
  private readonly risk: C.RiskAnalysis;
  private readonly confidence: C.ConfidenceScoring;
  private readonly dependencies: C.DependencyAnalysis;
  private readonly resources: C.ResourceRequirements;
  private readonly timeToValue: C.TimeToValueAnalysis;
  private readonly strategic: C.StrategicAlignment;

  constructor(d: C.OpportunityDependencies = {}) {
    this.scoring = d.opportunityScoring ?? new OpportunityScoring();
    this.roi = d.roiAnalysis ?? new ROIAnalysis();
    this.impact = d.impactAnalysis ?? new ImpactAnalysis();
    this.risk = d.riskAnalysis ?? new RiskAnalysis();
    this.confidence = d.confidenceScoring ?? new ConfidenceScoring();
    this.dependencies = d.dependencyAnalysis ?? new DependencyAnalysis();
    this.resources = d.resourceRequirements ?? new ResourceRequirements();
    this.timeToValue = d.timeToValueAnalysis ?? new TimeToValueAnalysis();
    this.strategic = d.strategicAlignment ?? new StrategicAlignment();
  }

  analyze(input: Parameters<C.OpportunityAnalysisEngine["analyze"]>[0]): T.OpportunityAnalysisResult {
    const scored = this.scoring.score(input);
    return {
      scored,
      roi: this.roi.analyze({ ...input, records: scored }),
      impact: this.impact.analyze({ ...input, records: scored }),
      risk: this.risk.analyze({ ...input, records: scored }),
      confidence: this.confidence.score({ ...input, records: scored }),
      dependencies: this.dependencies.analyze({ ...input, records: scored }),
      resources: this.resources.analyze({ ...input, records: scored }),
      timeToValue: this.timeToValue.analyze({ ...input, records: scored }),
      strategicAlignment: this.strategic.analyze({ ...input, records: scored }),
      lenses,
      narrative: `${scored.length} opportunities were scored across ROI, impact, risk, confidence, dependencies, resources, time-to-value, and strategic alignment.`,
    };
  }
}
