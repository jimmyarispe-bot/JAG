/**
 * Part 2: write remaining Cultural Intelligence engines, composers, docs.
 * Run after generate-cultural-intelligence.mjs
 */
import fs from "node:fs";
import path from "node:path";

const DEST = path.resolve("src/lib/platform/intelligence/cultural");
const w = (name, content) => fs.writeFileSync(path.join(DEST, name), content, "utf8");

const AREA_META = [
  ["organizational_culture", "OrganizationalCultureIntelligence", ["Culture cohesion signal", "Culture fragmentation hotspot"], "Organizational Culture"],
  ["team_culture", "TeamCultureIntelligence", ["Team norms strength", "Team culture friction"], "Team Culture"],
  ["leadership_culture", "LeadershipCultureIntelligence", ["Leadership culture clarity", "Leadership culture gap"], "Leadership Culture"],
  ["mission_alignment", "MissionAlignmentIntelligence", ["Mission clarity signal", "Mission drift hotspot"], "Mission Alignment"],
  ["values_alignment", "ValuesAlignmentIntelligence", ["Values living evidence", "Values gap hotspot"], "Values Alignment"],
  ["employee_engagement", "EmployeeEngagementIntelligence", ["Engagement energy signal", "Engagement drop hotspot"], "Employee Engagement"],
  ["collaboration_culture", "CollaborationCultureIntelligence", ["Collaboration norms signal", "Collaboration friction"], "Collaboration Culture"],
  ["communication_culture", "CommunicationCultureIntelligence", ["Communication openness", "Communication breakdown"], "Communication Culture"],
  ["innovation_culture", "InnovationCultureIntelligence", ["Innovation openness", "Innovation stagnation"], "Innovation Culture"],
  ["learning_culture", "LearningCultureIntelligence", ["Learning appetite", "Learning resistance"], "Learning Culture"],
  ["psychological_safety", "PsychologicalSafetyIntelligence", ["Safety climate signal", "Safety erosion hotspot"], "Psychological Safety"],
  ["inclusion_belonging", "InclusionBelongingIntelligence", ["Belonging strength", "Inclusion gap"], "Inclusion Belonging"],
  ["cross_cultural", "CrossCulturalIntelligence", ["Cross-cultural fluency", "Cross-cultural friction"], "Cross Cultural"],
  ["community_culture", "CommunityCultureIntelligence", ["Community connection", "Community disconnect"], "Community Culture"],
  ["cultural_risk", "CulturalRiskIntelligence", ["Cultural risk calm", "Cultural risk spike"], "Cultural Risk"],
  ["cultural_opportunity", "CulturalOpportunityIntelligence", ["Culture opportunity signal", "Missed culture opportunity"], "Cultural Opportunity"],
  ["cultural_transformation", "CulturalTransformationIntelligence", ["Transformation readiness", "Transformation resistance"], "Cultural Transformation"],
];

for (const [area, cls, titles, label] of AREA_META) {
  const file = area.replaceAll("_", "-") + "-intelligence.ts";
  w(file, `import { createAreaIntelligence } from "@/lib/platform/intelligence/cultural/area-factory";
export class ${cls} extends createAreaIntelligence("${area}", ["${titles[0]}", "${titles[1]}"], "${label}") {}
`);
}

w("area-factory.ts", `import type { CulturalAreaIntelligence } from "@/lib/platform/intelligence/cultural/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/cultural/models";
import type { CulturalArea, CulturalAreaSuite } from "@/lib/platform/intelligence/cultural/types";

export function createAreaIntelligence(
  area: CulturalArea,
  titles: [string, string],
  forceLabel: string,
): new () => CulturalAreaIntelligence {
  return class implements CulturalAreaIntelligence {
    assess(input: Parameters<CulturalAreaIntelligence["assess"]>[0]): CulturalAreaSuite {
      const score = clamp(input.baseline.areaScores[area]);
      const records = [
        { title: titles[0], delta: 3 },
        { title: titles[1], delta: -4 },
      ].map((item) => {
        const value = clamp(score + item.delta);
        return {
          id: input.createId("cul-signal"),
          area,
          title: item.title,
          score: value,
          status: value >= 75 ? "favorable" as const : value >= 60 ? "improving" as const : "at_risk" as const,
          signal: \`\${item.title} reading \${Math.round(value)}.\`,
          evidence: [\`baseline:\${area}\`, \`indicator:\${area}:current\`],
          lenses: buildLens({
            missionAlignment: \`Mission alignment linked to \${area} at \${Math.round(value)}.\`,
            valuesAlignment: \`Values alignment around \${area} conditions.\`,
            culturalHealth: \`Cultural health implications of \${area}.\`,
            collaborationQuality: \`Collaboration quality surrounding \${area}.\`,
            innovationReadiness: \`Innovation readiness associated with \${area}.\`,
            psychologicalSafety: \`Psychological safety reading for \${area}.\`,
            engagement: \`Engagement pressure for \${area} at \${Math.round(value)}.\`,
            longTermCulturalOutlook: \`Long-term cultural outlook for \${area} developments.\`,
          }),
          narrative: \`\${item.title} score \${Math.round(value)}.\`,
        };
      });
      return {
        area,
        records,
        score,
        favorableCount: records.filter(r => r.status === "favorable").length,
        atRiskCount: records.filter(r => r.status === "at_risk").length,
        narrative: \`\${forceLabel} cultural score \${Math.round(score)}.\`,
      };
    }
  };
}
`);

w("cultural-analysis-engine.ts", `import type { CulturalAnalysisEngineContract } from "@/lib/platform/intelligence/cultural/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/cultural/models";
import { CULTURAL_ANALYSIS_KINDS, type CulturalAnalysisSuite } from "@/lib/platform/intelligence/cultural/types";

export class CulturalAnalysisEngine implements CulturalAnalysisEngineContract {
  assess(input: Parameters<CulturalAnalysisEngineContract["assess"]>[0]): CulturalAnalysisSuite {
    const scoreFor = (kind: (typeof CULTURAL_ANALYSIS_KINDS)[number]) => {
      switch (kind) {
        case "trends": return clamp(70 - (100 - input.baseline.psychologicalSafety) / 5);
        case "forecasts": return input.forecasts.maturityScore;
        case "scenario_planning": return input.baseline.scenarioMaturity;
        case "culture_mapping": return input.baseline.culturalHealth;
        case "mission_alignment": return input.baseline.missionAlignment;
        case "values_alignment": return input.baseline.valuesAlignment;
        case "engagement_quality": return input.baseline.engagement;
        case "collaboration_quality": return input.baseline.collaborationQuality;
        case "innovation_readiness": return input.baseline.innovationReadiness;
        case "psychological_safety": return input.baseline.psychologicalSafety;
        case "cultural_risk": return clamp(100 - input.baseline.areaScores.cultural_risk);
        case "early_warning": return clamp((input.baseline.scenarioMaturity + input.baseline.culturalHealth) / 2);
      }
    };
    const analyses = CULTURAL_ANALYSIS_KINDS.map(kind => {
      const score = scoreFor(kind);
      return {
        id: input.createId("cul-analysis"),
        kind,
        title: \`\${kind.replaceAll("_", " ")} analysis\`,
        score,
        status: score >= 75 ? "favorable" as const : score >= 60 ? "improving" as const : "at_risk" as const,
        lenses: buildLens({
          missionAlignment: \`\${kind} score \${Math.round(score)}.\`,
          valuesAlignment: \`Values lens through \${kind.replaceAll("_", " ")}.\`,
          culturalHealth: \`Cultural health posture responds to \${kind.replaceAll("_", " ")}.\`,
          collaborationQuality: \`Collaboration implications of \${kind.replaceAll("_", " ")}.\`,
          innovationReadiness: \`Innovation implications of \${kind.replaceAll("_", " ")}.\`,
          psychologicalSafety: \`Safety tracked through \${kind.replaceAll("_", " ")}.\`,
          engagement: \`Engagement pressure under \${kind.replaceAll("_", " ")}.\`,
          longTermCulturalOutlook: \`Use \${kind.replaceAll("_", " ")} insight to time cultural response.\`,
        }),
        narrative: \`\${kind} analysis score \${Math.round(score)}.\`,
      };
    });
    return {
      analyses,
      kindsCovered: [...CULTURAL_ANALYSIS_KINDS],
      maturityScore: analyses.reduce((s, a) => s + a.score, 0) / analyses.length,
      narrative: \`Cultural analysis covers \${CULTURAL_ANALYSIS_KINDS.length} culture lenses.\`,
    };
  }
}
`);

w("culture-mapping-engine.ts", `import type { CultureMappingEngineContract } from "@/lib/platform/intelligence/cultural/contracts";
import type { CultureMappingSuite } from "@/lib/platform/intelligence/cultural/types";

export class CultureMappingEngine implements CultureMappingEngineContract {
  assess(input: Parameters<CultureMappingEngineContract["assess"]>[0]): CultureMappingSuite {
    const suite = input.areas.organizational_culture;
    const records = suite.records.map(record => ({
      id: input.createId("cul-mapping"),
      title: record.title,
      confidence: record.score,
      lenses: record.lenses,
      narrative: \`Culture mapping: \${record.title} at \${Math.round(record.score)}.\`,
    }));
    return {
      records,
      score: suite.score,
      cultureIndex: input.baseline.culturalHealth,
      narrative: \`Culture mapping suite index \${Math.round(input.baseline.culturalHealth)}.\`,
    };
  }
}
`);

w("engagement-engine.ts", `import type { EngagementEngineContract } from "@/lib/platform/intelligence/cultural/contracts";
import type { EngagementSuite } from "@/lib/platform/intelligence/cultural/types";

export class EngagementEngine implements EngagementEngineContract {
  assess(input: Parameters<EngagementEngineContract["assess"]>[0]): EngagementSuite {
    const suite = input.areas.employee_engagement;
    const records = suite.records.map(record => ({
      id: input.createId("cul-engagement"),
      title: record.title,
      engagement: record.score,
      lenses: record.lenses,
      narrative: \`Engagement analysis: \${record.title} at \${Math.round(record.score)}.\`,
    }));
    return {
      records,
      score: suite.score,
      engagementIndex: input.baseline.engagement,
      narrative: \`Engagement suite index \${Math.round(input.baseline.engagement)}.\`,
    };
  }
}
`);

w("mission-alignment-engine.ts", `import type { MissionAlignmentEngineContract } from "@/lib/platform/intelligence/cultural/contracts";
import type { MissionAlignmentSuite } from "@/lib/platform/intelligence/cultural/types";

export class MissionAlignmentEngine implements MissionAlignmentEngineContract {
  assess(input: Parameters<MissionAlignmentEngineContract["assess"]>[0]): MissionAlignmentSuite {
    const suite = input.areas.mission_alignment;
    const records = suite.records.map(record => ({
      id: input.createId("cul-mission"),
      title: record.title,
      alignment: record.score,
      lenses: record.lenses,
      narrative: \`Mission alignment: \${record.title} at \${Math.round(record.score)}.\`,
    }));
    return {
      records,
      score: suite.score,
      missionIndex: input.baseline.missionAlignment,
      narrative: \`Mission alignment suite index \${Math.round(input.baseline.missionAlignment)}.\`,
    };
  }
}
`);

w("values-alignment-engine.ts", `import type { ValuesAlignmentEngineContract } from "@/lib/platform/intelligence/cultural/contracts";
import type { ValuesAlignmentSuite } from "@/lib/platform/intelligence/cultural/types";

export class ValuesAlignmentEngine implements ValuesAlignmentEngineContract {
  assess(input: Parameters<ValuesAlignmentEngineContract["assess"]>[0]): ValuesAlignmentSuite {
    const suite = input.areas.values_alignment;
    const records = suite.records.map(record => ({
      id: input.createId("cul-values"),
      title: record.title,
      alignment: record.score,
      lenses: record.lenses,
      narrative: \`Values alignment: \${record.title} at \${Math.round(record.score)}.\`,
    }));
    return {
      records,
      score: suite.score,
      valuesIndex: input.baseline.valuesAlignment,
      narrative: \`Values alignment suite index \${Math.round(input.baseline.valuesAlignment)}.\`,
    };
  }
}
`);

w("collaboration-engine.ts", `import type { CollaborationEngineContract } from "@/lib/platform/intelligence/cultural/contracts";
import type { CollaborationSuite } from "@/lib/platform/intelligence/cultural/types";

export class CollaborationEngine implements CollaborationEngineContract {
  assess(input: Parameters<CollaborationEngineContract["assess"]>[0]): CollaborationSuite {
    const suite = input.areas.collaboration_culture;
    const records = suite.records.map(record => ({
      id: input.createId("cul-collab"),
      title: record.title,
      collaboration: record.score,
      lenses: record.lenses,
      narrative: \`Collaboration culture: \${record.title} at \${Math.round(record.score)}.\`,
    }));
    return {
      records,
      score: suite.score,
      collaborationIndex: input.baseline.collaborationQuality,
      narrative: \`Collaboration suite index \${Math.round(input.baseline.collaborationQuality)}.\`,
    };
  }
}
`);

w("cultural-forecast-engine.ts", `import type { CulturalForecastEngineContract } from "@/lib/platform/intelligence/cultural/contracts";
import { buildLens, clamp, levelFromValue, outlookFromScore } from "@/lib/platform/intelligence/cultural/models";
import { CULTURAL_AREAS, type CulturalForecastSuite } from "@/lib/platform/intelligence/cultural/types";

export class CulturalForecastEngine implements CulturalForecastEngineContract {
  assess(input: Parameters<CulturalForecastEngineContract["assess"]>[0]): CulturalForecastSuite {
    const forecasts = CULTURAL_AREAS.map((area, index) => {
      const baseline = input.areas[area].score;
      const forecast = clamp(baseline + (index % 3) - 1 + input.baseline.forecastMaturity / 50);
      const confidence = levelFromValue(input.baseline.evidenceCoverage / 100);
      const horizon = index % 3 === 0 ? "near" as const : index % 3 === 1 ? "medium" as const : "long" as const;
      return {
        id: input.createId("cul-forecast"),
        area,
        horizon,
        baseline,
        forecast,
        low: clamp(forecast - 8),
        high: clamp(forecast + 8),
        confidence,
        lenses: buildLens({
          missionAlignment: \`\${area} mission forecast \${Math.round(forecast)} over \${horizon} horizon.\`,
          valuesAlignment: \`Values path for \${area} band \${Math.round(forecast - 8)}-\${Math.round(forecast + 8)}.\`,
          culturalHealth: \`Cultural health outlook tied to \${area} forecast.\`,
          collaborationQuality: \`Collaboration under \${area} \${horizon}-term path.\`,
          innovationReadiness: \`Innovation implication of \${area} trajectory.\`,
          psychologicalSafety: \`Safety sensitivity to \${area} forecast.\`,
          engagement: \`Engagement load under \${area} forecast path.\`,
          longTermCulturalOutlook: \`Act on \${area} \${horizon}-horizon cultural window.\`,
        }),
        narrative: \`\${area} \${horizon}-term cultural forecast \${Math.round(forecast)}.\`,
      };
    });
    const avg = forecasts.reduce((s, f) => s + f.forecast, 0) / forecasts.length;
    const volatility = Math.max(...forecasts.map(f => f.high - f.low)) - 8;
    return {
      forecasts,
      outlook: outlookFromScore(avg, volatility),
      maturityScore: input.baseline.forecastMaturity,
      narrative: \`Cultural forecast suite covers \${forecasts.length} areas with near/medium/long horizons.\`,
    };
  }
}
`);

w("cultural-trend-engine.ts", `import type { CulturalTrendEngineContract } from "@/lib/platform/intelligence/cultural/contracts";
import { buildLens, clamp, levelFromValue } from "@/lib/platform/intelligence/cultural/models";
import { CULTURAL_AREAS, type CulturalTrendSuite } from "@/lib/platform/intelligence/cultural/types";

export class CulturalTrendEngine implements CulturalTrendEngineContract {
  assess(input: Parameters<CulturalTrendEngineContract["assess"]>[0]): CulturalTrendSuite {
    const trends = CULTURAL_AREAS.map((area, index) => {
      const score = input.areas[area].score;
      const magnitude = clamp(Math.abs(score - 65) + index % 4);
      const direction = score >= 70 ? "improving" as const : score >= 55 ? "stable" as const : "worsening" as const;
      return {
        id: input.createId("cul-trend"),
        area,
        title: \`\${area.replaceAll("_", " ")} cultural trend\`,
        direction,
        magnitude,
        confidence: levelFromValue(input.baseline.evidenceCoverage / 100),
        lenses: buildLens({
          missionAlignment: \`\${area} is \${direction} with magnitude \${Math.round(magnitude)}.\`,
          valuesAlignment: \`Values trend pressure around \${area}.\`,
          culturalHealth: \`Cultural health sensitivity to \${direction} \${area} path.\`,
          collaborationQuality: \`Collaboration tracks \${area} trend.\`,
          innovationReadiness: \`Innovation implication of \${direction} \${area}.\`,
          psychologicalSafety: \`Safety spillover from \${area} trend.\`,
          engagement: \`Engagement load under \${direction} \${area}.\`,
          longTermCulturalOutlook: \`Monitor \${area} acceleration and reversal.\`,
        }),
        narrative: \`\${area} cultural trend is \${direction}.\`,
      };
    });
    return {
      trends,
      improvingCount: trends.filter(t => t.direction === "improving").length,
      worseningCount: trends.filter(t => t.direction === "worsening").length,
      narrative: \`\${trends.filter(t => t.direction === "improving").length} improving and \${trends.filter(t => t.direction === "worsening").length} worsening cultural trends.\`,
    };
  }
}
`);

w("cultural-scenario-engine.ts", `import type { CulturalScenarioEngineContract } from "@/lib/platform/intelligence/cultural/contracts";
import { buildLens, clamp, priorityFromScore } from "@/lib/platform/intelligence/cultural/models";
import { CULTURAL_SCENARIOS, type CulturalScenarioSuite } from "@/lib/platform/intelligence/cultural/types";

const SCENARIO_TITLES: Record<(typeof CULTURAL_SCENARIOS)[number], string> = {
  culture_fragmentation: "Culture fragmentation",
  values_drift: "Values drift",
  engagement_collapse: "Engagement collapse",
  psychological_safety_failure: "Psychological safety failure",
  mission_misalignment: "Mission misalignment",
  innovation_stagnation: "Innovation stagnation",
  inclusion_backslide: "Inclusion backslide",
  collaboration_breakdown: "Collaboration breakdown",
  transformation_resistance: "Transformation resistance",
  cross_cultural_friction: "Cross-cultural friction",
};

export class CulturalScenarioEngine implements CulturalScenarioEngineContract {
  assess(input: Parameters<CulturalScenarioEngineContract["assess"]>[0]): CulturalScenarioSuite {
    const pressure = ((100 - input.baseline.psychologicalSafety) + (100 - input.baseline.valuesAlignment) + (100 - input.baseline.missionAlignment)) / 3;
    const scenarios = CULTURAL_SCENARIOS.map((kind, index) => {
      const elevated = ["culture_fragmentation", "values_drift", "engagement_collapse", "psychological_safety_failure"].includes(kind);
      const baseProb = clamp(25 + (index % 5) * 8 + (pressure > 55 && elevated ? 12 : 0));
      const organizationalImpact = clamp(40 + pressure / 2 + index);
      const missionImpact = clamp(organizationalImpact + (100 - input.baseline.missionAlignment) / 5);
      const engagementImpact = clamp(organizationalImpact + (100 - input.baseline.engagement) / 5);
      return {
        id: input.createId("cul-scenario"),
        kind,
        title: SCENARIO_TITLES[kind],
        probability: baseProb / 100,
        severity: priorityFromScore(100 - organizationalImpact),
        organizationalImpact,
        missionImpact,
        engagementImpact,
        monitors: [\`\${kind}:leading\`, \`\${kind}:lagging\`, \`\${kind}:cultural\`],
        lenses: buildLens({
          missionAlignment: \`\${SCENARIO_TITLES[kind]} probability \${Math.round(baseProb)}%.\`,
          valuesAlignment: \`Values drift risk under \${kind.replaceAll("_", " ")}.\`,
          culturalHealth: \`Cultural health impact score \${Math.round(missionImpact)}.\`,
          collaborationQuality: \`Collaboration stress under \${kind.replaceAll("_", " ")}.\`,
          innovationReadiness: \`Innovation stress from \${SCENARIO_TITLES[kind]}.\`,
          psychologicalSafety: \`Safety exposure if \${kind.replaceAll("_", " ")} materializes.\`,
          engagement: \`Engagement load score \${Math.round(engagementImpact)}.\`,
          longTermCulturalOutlook: \`Pre-position contingency playbooks for \${kind.replaceAll("_", " ")}.\`,
        }),
        narrative: \`\${SCENARIO_TITLES[kind]} monitored at \${Math.round(baseProb)}% probability.\`,
      };
    });
    const primary = [...scenarios].sort((a, b) => b.probability - a.probability)[0]!;
    return {
      scenarios,
      primaryScenario: primary.kind,
      monitoredCount: scenarios.length,
      narrative: \`Primary scenario \${primary.title}; \${scenarios.length} cultural scenarios monitored.\`,
    };
  }
}
`);

w("early-warning-engine.ts", `import type { EarlyWarningEngineContract } from "@/lib/platform/intelligence/cultural/contracts";
import { priorityFromScore } from "@/lib/platform/intelligence/cultural/models";
import type { EarlyWarningSuite } from "@/lib/platform/intelligence/cultural/types";

export class EarlyWarningEngine implements EarlyWarningEngineContract {
  assess(input: Parameters<EarlyWarningEngineContract["assess"]>[0]): EarlyWarningSuite {
    const worsening = input.trends.trends.filter(t => t.direction === "worsening");
    const highProb = input.scenarios.scenarios.filter(s => s.probability >= 0.4);
    const alerts = [
      ...worsening.slice(0, 4).map(t => ({
        id: input.createId("cul-alert"),
        title: \`Worsening trend: \${t.title}\`,
        severity: priorityFromScore(100 - t.magnitude),
        source: t.area,
        score: t.magnitude,
        lenses: t.lenses,
        narrative: t.narrative,
      })),
      ...highProb.slice(0, 4).map(s => ({
        id: input.createId("cul-alert"),
        title: \`Elevated scenario: \${s.title}\`,
        severity: s.severity,
        source: s.kind,
        score: s.probability * 100,
        lenses: s.lenses,
        narrative: s.narrative,
      })),
    ];
    const score = alerts.length ? 100 - alerts.reduce((s, a) => s + a.score, 0) / alerts.length : 72;
    return {
      alerts,
      score,
      alertCount: alerts.length,
      narrative: \`Early warning suite: \${alerts.length} alerts from worsening trends and high-probability scenarios.\`,
    };
  }
}
`);

w("closed-learning-loop.ts", `import type {
  ClosedLearningLoopContribution,
  CulturalRecommendationRecord,
  CulturalScenarioSuite,
  CulturalTrendSuite,
} from "@/lib/platform/intelligence/cultural/types";

export class ClosedLearningLoop {
  contribute(input: {
    trends: CulturalTrendSuite;
    scenarios: CulturalScenarioSuite;
    recommendations: CulturalRecommendationRecord[];
    now: Date;
    createId: (prefix: string) => string;
  }): ClosedLearningLoopContribution {
    const worsening = input.trends.trends.filter(t => t.direction === "worsening");
    return {
      id: input.createId("cul-learning"),
      destinations: ["behavioral", "stakeholder", "human-capital", "opportunity", "knowledge", "executive-decision", "predictive"],
      lessons: input.trends.trends.slice(0, 5).map(t => t.narrative),
      improvementActions: input.recommendations.map(r => r.action),
      decisionSignals: worsening.slice(0, 4).map(t => \`\${t.area}:\${t.direction}\`),
      forecastSignals: input.scenarios.scenarios.slice(0, 4).map(s => \`\${s.kind}:\${Math.round(s.probability * 100)}\`),
      contributedAt: input.now.toISOString(),
      narrative: "Cultural evidence feeds Behavioral, Stakeholder, Human Capital, Opportunity, Knowledge, Executive Decision, and Predictive Intelligence.",
    };
  }
}
`);

w("knowledge-contribution.ts", `import type { CulturalForecastSuite, CulturalKnowledgeContribution, CulturalScenarioSuite } from "@/lib/platform/intelligence/cultural/types";

/**
 * Cultural knowledge contribution drafts for Knowledge Intelligence soft-read
 * and downstream learning. Knowledge is soft-read inbound on CulturalRequest;
 * closed-learning destinations include knowledge among seven domains.
 */
export class CulturalKnowledgeContributionEngine {
  contribute(input: {
    forecasts: CulturalForecastSuite;
    scenarios: CulturalScenarioSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): CulturalKnowledgeContribution {
    const artifacts = [
      ...input.forecasts.forecasts.slice(0, 4).map(forecast => ({
        id: input.createId("cul-knowledge"),
        type: "cultural_forecast",
        title: forecast.narrative,
        confidence: forecast.forecast / 100,
        sourceRef: forecast.id,
        validated: forecast.confidence === "high" || forecast.confidence === "medium",
        metadata: { area: forecast.area, capturedAt: input.now.toISOString() },
      })),
      ...input.scenarios.scenarios.slice(0, 4).map(scenario => ({
        id: input.createId("cul-knowledge"),
        type: "cultural_scenario",
        title: scenario.title,
        confidence: scenario.probability,
        sourceRef: scenario.id,
        validated: scenario.probability >= .35,
        metadata: { kind: scenario.kind, capturedAt: input.now.toISOString() },
      })),
    ];
    return {
      artifacts,
      contributionScore: artifacts.reduce((s, a) => s + a.confidence, 0) / Math.max(1, artifacts.length) * 100,
      validatedCount: artifacts.filter(a => a.validated).length,
      narrative: \`\${artifacts.length} cultural learning drafts prepared for Knowledge and decision domains.\`,
    };
  }
}
`);

w("cultural-reasoner.ts", `import type { CulturalReasonerContract } from "@/lib/platform/intelligence/cultural/contracts";
import type { CulturalReasoningResult } from "@/lib/platform/intelligence/cultural/types";

export class CulturalReasoner implements CulturalReasonerContract {
  reason(input: Parameters<CulturalReasonerContract["reason"]>[0]): CulturalReasoningResult {
    const connectedForces = input.trends.trends
      .slice()
      .sort((a, b) => b.magnitude - a.magnitude)
      .slice(0, 6)
      .map(t => t.title);
    const evidenceGaps = input.forecasts.forecasts
      .filter(f => f.confidence === "low" || f.confidence === "unknown")
      .slice(0, 6)
      .map(f => f.narrative);
    return {
      answer: input.request.question ??
        \`Cultural outlook is \${input.forecasts.outlook} with primary scenario \${input.scenarios.primaryScenario.replaceAll("_", " ")}.\`,
      connectedForces,
      evidenceGaps,
      confidence: input.confidence,
      narrative: \`Reasoning used \${input.trends.trends.length} trends, \${input.forecasts.forecasts.length} forecasts, and \${input.scenarios.scenarios.length} scenarios.\`,
    };
  }
}
`);

w("cultural-intelligence.ts", `import { buildLens, clamp, priorityFromScore, statusFromScore } from "@/lib/platform/intelligence/cultural/models";
import type {
  CulturalArea, CulturalAreaSuite, CulturalBaseline, CulturalDashboard,
  CulturalForecastSuite, CulturalHealthScore, CulturalOpportunityRecord,
  CulturalRecommendationRecord, CulturalRiskRecord, CulturalScenarioSuite,
  CulturalScore, CulturalAnalysisSuite,
} from "@/lib/platform/intelligence/cultural/types";
import { CULTURAL_AREAS } from "@/lib/platform/intelligence/cultural/types";

export const score = (key: string, label: string, value: number): CulturalScore => {
  const v = clamp(value);
  return { key, label, value: v, status: statusFromScore(v), band: priorityFromScore(v), narrative: \`\${label} is \${statusFromScore(v)} at \${Math.round(v)}.\` };
};

const lens = (area: string, value: number) => buildLens({
  missionAlignment: \`\${area} mission alignment scored \${Math.round(value)}.\`,
  valuesAlignment: \`Values alignment linked to \${area}.\`,
  culturalHealth: \`Cultural health around \${area}.\`,
  collaborationQuality: \`Collaboration quality relative to \${area} conditions.\`,
  innovationReadiness: \`Innovation readiness reading for \${area}.\`,
  psychologicalSafety: \`Psychological safety implications of \${area}.\`,
  engagement: \`Engagement pressure from \${area}.\`,
  longTermCulturalOutlook: \`Timing window for \${area}-linked cultural action.\`,
});

export class CulturalIntelligence {
  composeScores(input: {
    baseline: CulturalBaseline;
    areas: Record<CulturalArea, CulturalAreaSuite>;
    forecast: number;
    scenario: number;
    analysis: number;
    earlyWarning: number;
    cultureMapping: number;
    engagement: number;
    missionAlignment: number;
    valuesAlignment: number;
  }) {
    const areaScores = Object.fromEntries(
      CULTURAL_AREAS.map(a => [a, score(\`cultural_\${a}\`, \`\${a} Cultural Score\`, input.areas[a].score)])
    ) as Record<CulturalArea, CulturalScore>;
    const overall =
      CULTURAL_AREAS.reduce((s, a) => s + areaScores[a].value, 0) / CULTURAL_AREAS.length * .5 +
      input.baseline.missionAlignment * .1 +
      input.baseline.engagement * .1 +
      input.baseline.psychologicalSafety * .08 +
      input.forecast * .08 +
      input.scenario * .07 +
      input.earlyWarning * .04 +
      input.cultureMapping * .03;
    return {
      healthScore: score("cultural_health", "Cultural Health Score", overall),
      areaScores,
      forecastScore: score("cultural_forecast", "Forecast Score", input.forecast),
      scenarioScore: score("cultural_scenario", "Scenario Score", input.scenario),
      analysisScore: score("cultural_analysis", "Analysis Score", input.analysis),
      earlyWarningScore: score("cultural_early_warning", "Early Warning Score", input.earlyWarning),
      cultureMappingScore: score("cultural_culture_mapping", "Culture Mapping Score", input.cultureMapping),
      engagementScore: score("cultural_engagement_engine", "Engagement Score", input.engagement),
      missionAlignmentScore: score("cultural_mission_alignment_engine", "Mission Alignment Score", input.missionAlignment),
      valuesAlignmentScore: score("cultural_values_alignment_engine", "Values Alignment Score", input.valuesAlignment),
    };
  }
}

export class CulturalRecommendationComposer {
  constructor(private createId: (prefix: string) => string) {}
  compose(
    areas: Record<CulturalArea, CulturalAreaSuite>,
    analysis: CulturalAnalysisSuite,
    scenarios: CulturalScenarioSuite,
    now: Date,
  ): CulturalRecommendationRecord[] {
    return [...CULTURAL_AREAS]
      .sort((a, b) => areas[a].score - areas[b].score)
      .slice(0, 6)
      .map((area, index) => ({
        id: this.createId("cul-rec"),
        title: \`Address \${area.replaceAll("_", " ")} cultural exposure\`,
        priority: priorityFromScore(areas[area].score),
        evidenceRefs: analysis.analyses.slice(0, 2).map(a => a.id).concat(scenarios.scenarios.slice(0, 1).map(s => s.id)),
        confidenceScore: .68,
        owner: index ? "cultural-owner" : "executive-team",
        dueDate: new Date(now.getTime() + (30 + index * 14) * 86400000).toISOString(),
        rationale: areas[area].narrative,
        action: \`Run a cultural response cycle for \${area.replaceAll("_", " ")}.\`,
        lenses: lens(area, areas[area].score),
        narrative: \`Prioritize \${area} cultural response.\`,
      }));
  }
}

export function composeRisksOpportunities(
  areas: Record<CulturalArea, CulturalAreaSuite>,
  createId: (prefix: string) => string,
): { risks: CulturalRiskRecord[]; opportunities: CulturalOpportunityRecord[] } {
  const ordered = [...CULTURAL_AREAS].sort((a, b) => areas[a].score - areas[b].score);
  return {
    risks: ordered.slice(0, 5).map(a => ({
      id: createId("cul-risk"),
      title: \`\${a.replaceAll("_", " ")} cultural pressure\`,
      area: a,
      severity: priorityFromScore(areas[a].score),
      score: 100 - areas[a].score,
      mitigation: \`Strengthen monitoring and culture playbooks for \${a.replaceAll("_", " ")}.\`,
      lenses: lens(a, areas[a].score),
      narrative: areas[a].narrative,
    })),
    opportunities: ordered.slice(-5).reverse().map(a => ({
      id: createId("cul-opp"),
      title: \`Capture \${a.replaceAll("_", " ")} cultural advantage\`,
      area: a,
      priority: priorityFromScore(100 - areas[a].score),
      score: areas[a].score,
      lenses: lens(a, areas[a].score),
      narrative: areas[a].narrative,
    })),
  };
}

export function composeHealth(
  scores: ReturnType<CulturalIntelligence["composeScores"]>,
  baseline: CulturalBaseline,
  forecasts: CulturalForecastSuite,
): CulturalHealthScore {
  const areaScores = Object.fromEntries(CULTURAL_AREAS.map(a => [a, scores.areaScores[a].value])) as Record<CulturalArea, number>;
  return {
    overallScore: scores.healthScore.value,
    status: scores.healthScore.status,
    outlook: forecasts.outlook,
    areaScores,
    missionScore: scores.missionAlignmentScore.value,
    engagementScore: scores.engagementScore.value,
    collaborationScore: baseline.collaborationQuality,
    valuesScore: scores.valuesAlignmentScore.value,
    forecastScore: scores.forecastScore.value,
    scenarioScore: scores.scenarioScore.value,
    lenses: lens("organization", scores.healthScore.value),
    narrative: scores.healthScore.narrative,
  };
}

export function composeDashboard(
  now: Date,
  health: CulturalHealthScore,
  baseline: CulturalBaseline,
  risks: CulturalRiskRecord[],
  opportunities: CulturalOpportunityRecord[],
): CulturalDashboard {
  return {
    generatedAt: now.toISOString(),
    headline: \`Executive Culture Overview: health \${Math.round(health.overallScore)}  -  \${health.status} (\${health.outlook})\`,
    overall: health.overallScore,
    areaScores: health.areaScores,
    outlook: health.outlook,
    missionAlignment: baseline.missionAlignment,
    valuesAlignment: baseline.valuesAlignment,
    engagement: baseline.engagement,
    topRisks: risks.map(r => r.title),
    topOpportunities: opportunities.map(o => o.title),
    narrative: health.narrative,
  };
}

export function composeCulturalHealth(
  scores: ReturnType<CulturalIntelligence["composeScores"]>,
  baseline: CulturalBaseline,
  forecasts: CulturalForecastSuite,
) {
  return composeHealth(scores, baseline, forecasts);
}

export const culturalLens = lens;
`);

console.log("Part 2 engines written");
