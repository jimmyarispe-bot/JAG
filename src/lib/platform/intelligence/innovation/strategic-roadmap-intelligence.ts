/**
 * Strategic Roadmap Intelligence — innovation roadmap clarity and sequencing.
 */

import type { StrategicRoadmapIntelligence as StrategicRoadmapIntelligenceContract } from "@/lib/platform/intelligence/innovation/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/innovation/models";
import type {
  ContinuousImprovementSuite,
  EmergingTechnologySuite,
  InnovationBaseline,
  InnovationHorizon,
  InnovationPortfolioSuite,
  RoadmapMilestoneRecord,
  StrategicRoadmapSuite,
} from "@/lib/platform/intelligence/innovation/types";

const MILESTONE_TEMPLATES: Array<{ title: string; horizon: InnovationHorizon; duePeriod: string }> = [
  { title: "Stabilize H1 core innovation backlog", horizon: "h1_core", duePeriod: "Q1" },
  { title: "Graduate two H2 experiments to scale", horizon: "h2_adjacent", duePeriod: "Q2" },
  { title: "Establish AI opportunity review board", horizon: "h2_adjacent", duePeriod: "Q1" },
  { title: "Fund one H3 transformational bet", horizon: "h3_transformational", duePeriod: "Q3" },
  { title: "Publish technology radar and adoption plan", horizon: "h2_adjacent", duePeriod: "Q2" },
  { title: "Close IP protection gaps for core assets", horizon: "h1_core", duePeriod: "Q3" },
];

export class StrategicRoadmapIntelligence implements StrategicRoadmapIntelligenceContract {
  assess(input: {
    baseline: InnovationBaseline;
    innovationPortfolio: InnovationPortfolioSuite;
    emergingTechnology: EmergingTechnologySuite;
    continuousImprovement: ContinuousImprovementSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): StrategicRoadmapSuite {
    const { baseline, innovationPortfolio, emergingTechnology, continuousImprovement, createId } = input;
    void input.now;
    const milestones: RoadmapMilestoneRecord[] = MILESTONE_TEMPLATES.map((template, index) => {
      const clarity = clamp(
        baseline.roadmapClarity +
          (template.horizon === "h1_core" ? 5 : 0) -
          (template.horizon === "h3_transformational" ? 6 : 0) +
          (index % 2) * 3
      );
      return {
        id: createId("inn-roadmap"),
        title: template.title,
        horizon: template.horizon,
        clarity,
        duePeriod: template.duePeriod,
        narrative: `${template.title} clarity ${Math.round(clarity)} (${template.duePeriod}).`,
        lenses: buildLens({
          innovationOpportunityExists: template.title,
          evidenceSupports: `Roadmap clarity ${Math.round(baseline.roadmapClarity)}; portfolio balance ${Math.round(innovationPortfolio.balanceScore)}.`,
          problemSolved: "Sequences innovation bets with executive visibility.",
          expectedImpact: `Milestone clarity ${Math.round(clarity)}.`,
          investmentRequired: "Governance time and capacity allocation.",
          experimentsValidate: "Stage reviews tied to experiment outcomes.",
          risksExist: "Roadmap drift and horizon imbalance.",
          capabilitiesRequired: "Strategy, portfolio governance, innovation ops",
        }),
      };
    });
    const clarityScore = clamp(
      milestones.reduce((sum, item) => sum + item.clarity, 0) / milestones.length
    );
    const horizonCoverage = clamp(
      (new Set(milestones.map((item) => item.horizon)).size / 3) * 100
    );
    const sequencingHealth = clamp(
      clarityScore * 0.45 +
        innovationPortfolio.balanceScore * 0.25 +
        continuousImprovement.momentumScore * 0.15 +
        emergingTechnology.awarenessScore * 0.15
    );

    return {
      milestones,
      clarityScore,
      horizonCoverage,
      sequencingHealth,
      narrative: `Roadmap clarity ${Math.round(clarityScore)}; sequencing health ${Math.round(sequencingHealth)}.`,
    };
  }
}
