/**
 * Innovation Intelligence — scores, health, dashboards, briefs,
 * pipeline/radar helpers, and risk/opportunity/recommendation analyzers.
 */

import type {
  ExecutiveInnovationBriefGenerator as ExecutiveInnovationBriefGeneratorContract,
  InnovationDashboard as InnovationDashboardContract,
  InnovationHealth as InnovationHealthContract,
  InnovationIntelligence as InnovationIntelligenceContract,
  InnovationOpportunityAnalyzer as InnovationOpportunityAnalyzerContract,
  InnovationRecommendationComposer as InnovationRecommendationComposerContract,
  InnovationRiskAnalyzer as InnovationRiskAnalyzerContract,
  InnovationSpecializedDashboards as InnovationSpecializedDashboardsContract,
} from "@/lib/platform/intelligence/innovation/contracts";
import {
  buildConfidence,
  buildLens,
  clamp,
  defaultCreateId,
  priorityFromRisk,
  priorityFromScore,
  scoreNarrative,
  statusFromScore,
} from "@/lib/platform/intelligence/innovation/models";
import type {
  EmergingTechnologySuite,
  ExecutiveInnovationBrief,
  ExperimentDashboardResult,
  ExperimentManagementSuite,
  IdeaBacklogResult,
  IdeaManagementSuite,
  InnovationBaseline,
  InnovationConfidenceScore,
  InnovationDashboardResult,
  InnovationHealthResult,
  InnovationOpportunityRecord,
  InnovationPipelineResult,
  InnovationPipelineStage,
  InnovationPortfolioResult,
  InnovationPortfolioSuite,
  InnovationRecommendationRecord,
  InnovationRiskRecord,
  InnovationScore,
  IdeaStatus,
  PipelineDashboardResult,
  PortfolioDashboardResult,
  RadarDashboardResult,
  TechnologyAdoptionSuite,
  TechnologyRadarItem,
  TechnologyRadarResult,
  TechnologyRadarRing,
} from "@/lib/platform/intelligence/innovation/types";
import { IDEA_STATUSES, TECHNOLOGY_RADAR_RINGS } from "@/lib/platform/intelligence/innovation/types";

type ScoreBundle = ReturnType<InnovationIntelligenceContract["composeScores"]>;

export function defaultInnovationConfidence(input: {
  baseline: InnovationBaseline;
  ideaManagement: { velocityScore: number; backlogHealth: number };
  experimentManagement: { throughputScore: number };
  innovationPortfolio: { balanceScore: number };
}): InnovationConfidenceScore {
  return buildConfidence([
    { key: "ideas", label: "Idea velocity", contribution: input.ideaManagement.velocityScore / 100 },
    { key: "experiments", label: "Experiment throughput", contribution: input.experimentManagement.throughputScore / 100 },
    { key: "portfolio", label: "Portfolio balance", contribution: input.innovationPortfolio.balanceScore / 100 },
    { key: "baseline", label: "Organization health", contribution: input.baseline.organizationHealthScore / 100 },
    { key: "backlog", label: "Backlog health", contribution: input.ideaManagement.backlogHealth / 100 },
  ]);
}

export function composeInnovationPipeline(input: {
  ideaManagement: IdeaManagementSuite;
  now: Date;
}): InnovationPipelineResult {
  const stages: InnovationPipelineStage[] = IDEA_STATUSES.map((stage: IdeaStatus) => {
    const count = input.ideaManagement.ideas.filter((idea) => idea.status === stage).length;
    return {
      stage,
      count,
      narrative: `${stage}: ${count} ideas`,
    };
  });
  const advancingCount = input.ideaManagement.ideas.filter((idea) =>
    ["validated", "experimenting", "scaling"].includes(idea.status)
  ).length;
  return {
    generatedAt: input.now.toISOString(),
    headline: `Innovation pipeline ${input.ideaManagement.ideas.length} ideas — ${advancingCount} advancing`,
    stages,
    totalIdeas: input.ideaManagement.ideas.length,
    advancingCount,
    narrative: `Pipeline across ${stages.length} stages; backlog health ${Math.round(input.ideaManagement.backlogHealth)}.`,
  };
}

export function composeIdeaBacklog(input: {
  ideaManagement: IdeaManagementSuite;
  now: Date;
}): IdeaBacklogResult {
  const prioritizedIdeas = [...input.ideaManagement.ideas].sort((a, b) => b.score - a.score);
  const topIdea = prioritizedIdeas[0]?.title ?? null;
  return {
    generatedAt: input.now.toISOString(),
    headline: `Idea backlog health ${Math.round(input.ideaManagement.backlogHealth)} — top ${topIdea ?? "none"}`,
    prioritizedIdeas,
    backlogHealth: input.ideaManagement.backlogHealth,
    topIdea,
    narrative: input.ideaManagement.narrative,
  };
}

export function composeTechnologyRadar(input: {
  technologyAdoption: TechnologyAdoptionSuite;
  emergingTechnology: EmergingTechnologySuite;
  now: Date;
  createId: (prefix: string) => string;
}): TechnologyRadarResult {
  const ringFor = (score: number, emerging: boolean): TechnologyRadarRing => {
    if (!emerging && score >= 75) return "adopt";
    if (score >= 65) return "trial";
    if (score >= 50) return "assess";
    return "hold";
  };

  const adoptionItems: TechnologyRadarItem[] = input.technologyAdoption.technologies.map((tech) => ({
    id: input.createId("inn-radar"),
    name: tech.technology,
    ring: ringFor(tech.readiness, false),
    score: tech.readiness,
    narrative: `${tech.technology} → ${ringFor(tech.readiness, false)}`,
  }));
  const emergingItems: TechnologyRadarItem[] = input.emergingTechnology.technologies.map((tech) => ({
    id: input.createId("inn-radar"),
    name: tech.technology,
    ring: ringFor(tech.awareness, true),
    score: tech.awareness,
    narrative: `${tech.technology} → ${ringFor(tech.awareness, true)}`,
  }));
  const items = [...adoptionItems, ...emergingItems];
  const counts = Object.fromEntries(
    TECHNOLOGY_RADAR_RINGS.map((ring) => [ring, items.filter((item) => item.ring === ring).length])
  ) as Record<TechnologyRadarRing, number>;

  return {
    generatedAt: input.now.toISOString(),
    headline: `Technology radar ${items.length} items — adopt ${counts.adopt} / trial ${counts.trial}`,
    items,
    adoptCount: counts.adopt,
    trialCount: counts.trial,
    assessCount: counts.assess,
    holdCount: counts.hold,
    narrative: `Radar coverage across ${TECHNOLOGY_RADAR_RINGS.join(", ")}.`,
  };
}

export function composeInnovationPortfolioResult(input: {
  innovationPortfolio: InnovationPortfolioSuite;
  now: Date;
}): InnovationPortfolioResult {
  const topItems = [...input.innovationPortfolio.items]
    .sort((a, b) => b.health - a.health)
    .slice(0, 5)
    .map((item) => item.name);
  return {
    generatedAt: input.now.toISOString(),
    headline: `Portfolio balance ${Math.round(input.innovationPortfolio.balanceScore)} — H1/H2/H3`,
    balanceScore: input.innovationPortfolio.balanceScore,
    h1Share: input.innovationPortfolio.h1Share,
    h2Share: input.innovationPortfolio.h2Share,
    h3Share: input.innovationPortfolio.h3Share,
    itemCount: input.innovationPortfolio.items.length,
    topItems,
    narrative: input.innovationPortfolio.narrative,
  };
}

export class InnovationIntelligence implements InnovationIntelligenceContract {
  composeScores(input: Parameters<InnovationIntelligenceContract["composeScores"]>[0]): ScoreBundle {
    const ideaValue = clamp(input.ideaManagement.velocityScore);
    const rdValue = clamp(input.researchDevelopment.intensityScore);
    const productServiceValue = clamp(input.productServiceInnovation.innovationScore);
    const processValue = clamp(input.processInnovation.innovationScore);
    const aiValue = clamp(input.aiOpportunity.densityScore);
    const adoptionValue = clamp(input.technologyAdoption.readinessScore);
    const emergingValue = clamp(input.emergingTechnology.awarenessScore);
    const portfolioValue = clamp(input.innovationPortfolio.balanceScore);
    const experimentValue = clamp(input.experimentManagement.throughputScore);
    const pocValue = clamp(input.proofOfConcept.conversionScore);
    const ipValue = clamp(input.intellectualProperty.coverageScore);
    const continuousValue = clamp(input.continuousImprovement.momentumScore);
    const roadmapValue = clamp(input.strategicRoadmap.clarityScore);
    const knowledgeValue = clamp(input.knowledgeContribution.contributionScore);

    const pipelineValue = clamp(
      ideaValue * 0.45 + input.ideaManagement.backlogHealth * 0.35 + experimentValue * 0.2
    );
    const radarValue = clamp(adoptionValue * 0.55 + emergingValue * 0.45);

    const healthValue = clamp(
      pipelineValue * 0.12 +
        experimentValue * 0.12 +
        portfolioValue * 0.12 +
        radarValue * 0.1 +
        ideaValue * 0.07 +
        rdValue * 0.06 +
        productServiceValue * 0.06 +
        processValue * 0.06 +
        aiValue * 0.05 +
        adoptionValue * 0.05 +
        emergingValue * 0.04 +
        pocValue * 0.04 +
        ipValue * 0.04 +
        continuousValue * 0.04 +
        roadmapValue * 0.03
    );

    void input.reasoning;
    void input.risks;
    void input.opportunities;
    void input.baseline;

    return {
      healthScore: score("innovation_health", "Innovation Health Score", healthValue),
      pipelineScore: score("innovation_pipeline", "Pipeline Score", pipelineValue),
      experimentScore: score("innovation_experiment", "Experiment Score", experimentValue),
      portfolioScore: score("innovation_portfolio", "Portfolio Score", portfolioValue),
      radarScore: score("innovation_radar", "Radar Score", radarValue),
      ideaScore: score("innovation_idea", "Idea Score", ideaValue),
      rdScore: score("innovation_rd", "R&D Score", rdValue),
      productServiceScore: score("innovation_product_service", "Product/Service Score", productServiceValue),
      processScore: score("innovation_process", "Process Score", processValue),
      aiOpportunityScore: score("innovation_ai", "AI Opportunity Score", aiValue),
      technologyAdoptionScore: score("innovation_adoption", "Technology Adoption Score", adoptionValue),
      emergingTechScore: score("innovation_emerging", "Emerging Tech Score", emergingValue),
      pocScore: score("innovation_poc", "PoC Score", pocValue),
      ipScore: score("innovation_ip", "IP Score", ipValue),
      continuousImprovementScore: score("innovation_ci", "Continuous Improvement Score", continuousValue),
      roadmapScore: score("innovation_roadmap", "Roadmap Score", roadmapValue),
      knowledgeScore: score("innovation_knowledge", "Knowledge Contribution Score", knowledgeValue),
    };
  }
}

export class InnovationHealth implements InnovationHealthContract {
  assess(input: Parameters<InnovationHealthContract["assess"]>[0]): InnovationHealthResult {
    const dimensions: Record<string, number> = {
      pipeline: input.scores.pipelineScore.value,
      experiment: input.scores.experimentScore.value,
      portfolio: input.scores.portfolioScore.value,
      radar: input.scores.radarScore.value,
      ideas: input.scores.ideaScore.value,
      roadmap: input.scores.roadmapScore.value,
    };
    const overallScore = clamp(
      Object.values(dimensions).reduce((sum, value) => sum + value, 0) / Object.values(dimensions).length
    );
    const status = statusFromScore(overallScore);
    return {
      overallScore,
      status,
      dimensions,
      lenses: buildLens({
        innovationOpportunityExists: `Pipeline ${Math.round(input.scores.pipelineScore.value)}; top idea ${input.ideaManagement.ideas[0]?.title ?? "none"}.`,
        evidenceSupports: input.ideaManagement.narrative,
        problemSolved: "Organizational capacity to discover, validate, and scale innovation.",
        expectedImpact: `Portfolio balance ${Math.round(input.innovationPortfolio.balanceScore)}.`,
        investmentRequired: "Prioritized innovation capacity and experiment funding.",
        experimentsValidate: input.experimentManagement.narrative,
        risksExist: "Pipeline stall, horizon imbalance, and weak experiment learning.",
        capabilitiesRequired: "Innovation ops, portfolio governance, experiment design",
      }),
      narrative: `Innovation health ${status} (${Math.round(overallScore)}).`,
    };
  }
}

export class InnovationDashboard implements InnovationDashboardContract {
  compose(input: Parameters<InnovationDashboardContract["compose"]>[0]): InnovationDashboardResult {
    return {
      generatedAt: input.now.toISOString(),
      headline: `Innovation health ${Math.round(input.scores.healthScore.value)} - ${input.scores.healthScore.status}`,
      overall: input.scores.healthScore.value,
      pipelineScore: input.scores.pipelineScore.value,
      experimentScore: input.scores.experimentScore.value,
      portfolioScore: input.scores.portfolioScore.value,
      radarScore: input.scores.radarScore.value,
      topRisks: input.risks.slice(0, 5).map((risk) => risk.title),
      topOpportunities: input.opportunities.slice(0, 5).map((opportunity) => opportunity.title),
      narrative: `Innovation dashboard: health ${Math.round(input.scores.healthScore.value)}, pipeline ${Math.round(input.scores.pipelineScore.value)}, experiments ${Math.round(input.scores.experimentScore.value)}.`,
    };
  }
}

export class InnovationSpecializedDashboards implements InnovationSpecializedDashboardsContract {
  pipeline(input: Parameters<InnovationSpecializedDashboardsContract["pipeline"]>[0]): PipelineDashboardResult {
    return {
      generatedAt: input.now.toISOString(),
      headline: input.pipeline.headline,
      pipelineScore: input.ideaManagement.velocityScore,
      ideaCount: input.pipeline.totalIdeas,
      advancingCount: input.pipeline.advancingCount,
      backlogHealth: input.ideaManagement.backlogHealth,
      narrative: input.pipeline.narrative,
    };
  }

  experiment(input: Parameters<InnovationSpecializedDashboardsContract["experiment"]>[0]): ExperimentDashboardResult {
    const completedCount = input.experimentManagement.experiments.filter(
      (experiment) => experiment.status === "completed" || experiment.status === "scaled"
    ).length;
    return {
      generatedAt: input.now.toISOString(),
      headline: `Experiment throughput ${Math.round(input.experimentManagement.throughputScore)} — ${input.experimentManagement.runningCount} running`,
      throughputScore: input.experimentManagement.throughputScore,
      runningCount: input.experimentManagement.runningCount,
      completedCount,
      successRate: input.experimentManagement.successRate,
      topExperiments: input.experimentManagement.experiments
        .slice()
        .sort((a, b) => b.learningValue - a.learningValue)
        .slice(0, 5)
        .map((experiment) => experiment.name),
      narrative: input.experimentManagement.narrative,
    };
  }

  portfolio(input: Parameters<InnovationSpecializedDashboardsContract["portfolio"]>[0]): PortfolioDashboardResult {
    return {
      generatedAt: input.now.toISOString(),
      headline: `Portfolio balance ${Math.round(input.innovationPortfolio.balanceScore)}`,
      balanceScore: input.innovationPortfolio.balanceScore,
      h1Share: input.innovationPortfolio.h1Share,
      h2Share: input.innovationPortfolio.h2Share,
      h3Share: input.innovationPortfolio.h3Share,
      itemCount: input.innovationPortfolio.items.length,
      narrative: input.innovationPortfolio.narrative,
    };
  }

  radar(input: Parameters<InnovationSpecializedDashboardsContract["radar"]>[0]): RadarDashboardResult {
    return {
      generatedAt: input.now.toISOString(),
      headline: input.technologyRadar.headline,
      radarScore: clamp(
        input.technologyAdoption.readinessScore * 0.55 + input.emergingTechnology.awarenessScore * 0.45
      ),
      adoptCount: input.technologyRadar.adoptCount,
      trialCount: input.technologyRadar.trialCount,
      assessCount: input.technologyRadar.assessCount,
      holdCount: input.technologyRadar.holdCount,
      narrative: input.technologyRadar.narrative,
    };
  }
}

export class InnovationRiskAnalyzer implements InnovationRiskAnalyzerContract {
  private readonly createId: (prefix: string) => string;

  constructor(createId: (prefix: string) => string = defaultCreateId) {
    this.createId = createId;
  }

  analyze(input: Parameters<InnovationRiskAnalyzerContract["analyze"]>[0]): InnovationRiskRecord[] {
    const risks: InnovationRiskRecord[] = [
      risk(
        this.createId,
        "Idea pipeline stall risk",
        "pipeline",
        clamp(100 - input.ideaManagement.backlogHealth),
        "Increase screening throughput and clear parked ideas.",
        "Pipeline velocity and backlog hygiene"
      ),
      risk(
        this.createId,
        "Experiment learning leakage",
        "experiments",
        clamp(100 - input.experimentManagement.successRate),
        "Institutionalize experiment retrospectives and kill criteria.",
        "Experiment throughput and learning capture"
      ),
      risk(
        this.createId,
        "Horizon portfolio imbalance",
        "portfolio",
        clamp(Math.abs(input.innovationPortfolio.h1Share - 0.5) * 120 + (1 - input.innovationPortfolio.h3Share) * 20),
        "Rebalance H1/H2/H3 allocations with stage-gate reviews.",
        "Portfolio governance"
      ),
      risk(
        this.createId,
        "IP protection exposure",
        "ip",
        clamp(input.intellectualProperty.exposurePressure),
        "Close IP gaps on high-value product and R&D assets.",
        "Intellectual property coverage"
      ),
    ];
    return risks.sort((left, right) => right.score - left.score);
  }
}

export class InnovationOpportunityAnalyzer implements InnovationOpportunityAnalyzerContract {
  private readonly createId: (prefix: string) => string;

  constructor(createId: (prefix: string) => string = defaultCreateId) {
    this.createId = createId;
  }

  analyze(input: Parameters<InnovationOpportunityAnalyzerContract["analyze"]>[0]): InnovationOpportunityRecord[] {
    const topAi = input.aiOpportunity.opportunities[0];
    const topEmerging = input.emergingTechnology.technologies[0];
    const topCi = input.continuousImprovement.opportunities[0];
    return [
      opportunity(
        this.createId,
        topAi?.opportunity ?? "Prioritize high-feasibility AI opportunities",
        priorityFromScore(input.aiOpportunity.densityScore),
        clamp(input.aiOpportunity.densityScore + 8),
        topAi?.impactEstimate ?? Math.round(input.baseline.aiOpportunityDensity * 3_000),
        Math.round(input.baseline.aiOpportunityDensity * 1_200),
        "ai"
      ),
      opportunity(
        this.createId,
        topEmerging
          ? `Advance emerging tech watch: ${topEmerging.technology}`
          : "Strengthen emerging technology awareness",
        priorityFromScore(input.emergingTechnology.awarenessScore),
        clamp(input.emergingTechnology.awarenessScore + 6),
        Math.round(input.emergingTechnology.disruptionIndex * 2_500),
        Math.round(input.emergingTechnology.disruptionIndex * 1_000),
        "foresight"
      ),
      opportunity(
        this.createId,
        topCi?.opportunity ?? "Accelerate continuous improvement opportunities",
        priorityFromScore(input.continuousImprovement.momentumScore),
        clamp(input.continuousImprovement.momentumScore + 5),
        topCi?.impactEstimate ?? Math.round(input.baseline.continuousImprovementMomentum * 2_000),
        Math.round(input.baseline.continuousImprovementMomentum * 800),
        "improvement"
      ),
      opportunity(
        this.createId,
        "Publish innovation knowledge drafts",
        priorityFromScore(input.knowledgeContribution.contributionScore),
        clamp(input.knowledgeContribution.contributionScore + 4),
        Math.round(input.knowledgeContribution.contributionScore * 4_000),
        Math.round(input.knowledgeContribution.contributionScore * 1_500),
        "knowledge"
      ),
    ].sort((left, right) => right.score - left.score);
  }
}

export class InnovationRecommendationComposer implements InnovationRecommendationComposerContract {
  private readonly createId: (prefix: string) => string;

  constructor(createId: (prefix: string) => string = defaultCreateId) {
    this.createId = createId;
  }

  compose(input: Parameters<InnovationRecommendationComposerContract["compose"]>[0]): InnovationRecommendationRecord[] {
    const now = input.now;
    const dueSoon = new Date(now.getTime() + 30 * 86_400_000).toISOString();
    const dueMedium = new Date(now.getTime() + 60 * 86_400_000).toISOString();
    const recommendations: InnovationRecommendationRecord[] = [];
    const experimentRefs = input.experimentManagement.experiments.slice(0, 3).map((experiment) => experiment.id);

    const topRisk = input.risks[0];
    if (topRisk) {
      recommendations.push({
        id: this.createId("inn-rec"),
        title: `Mitigate ${topRisk.category} innovation risk`,
        priority: topRisk.severity,
        evidenceRefs: [`risk:${topRisk.id}`],
        confidenceScore: clamp(input.baseline.executionScore),
        riskScore: topRisk.score,
        impactEstimate: Math.round(topRisk.score * 3_500),
        investmentEstimate: Math.round(topRisk.score * 1_800),
        experimentRefs,
        capabilitiesRequired: ["innovation_ops", "executive_sponsorship"],
        owner: "strategy",
        dueDate: dueSoon,
        rationale: topRisk.narrative,
        action: topRisk.mitigation,
        lenses: topRisk.lenses,
        narrative: `Prioritize ${topRisk.category} innovation risk mitigation.`,
      });
    }

    const topIdea = [...input.ideaManagement.ideas].sort((a, b) => b.score - a.score)[0];
    if (topIdea) {
      recommendations.push({
        id: this.createId("inn-rec"),
        title: `Advance idea: ${topIdea.title}`,
        priority: priorityFromScore(100 - topIdea.score),
        evidenceRefs: [`idea:${topIdea.id}`],
        confidenceScore: clamp(topIdea.score),
        riskScore: clamp(100 - topIdea.score),
        impactEstimate: topIdea.impactEstimate,
        investmentEstimate: topIdea.investmentEstimate,
        experimentRefs,
        capabilitiesRequired: [topIdea.owner, "experiment_management"],
        owner: topIdea.owner,
        dueDate: dueMedium,
        rationale: topIdea.narrative,
        action: `Move ${topIdea.title} through next pipeline gate.`,
        lenses: topIdea.lenses,
        narrative: topIdea.narrative,
      });
    }

    const topMilestone = input.strategicRoadmap.milestones[0];
    if (topMilestone) {
      recommendations.push({
        id: this.createId("inn-rec"),
        title: `Execute roadmap: ${topMilestone.title}`,
        priority: priorityFromScore(topMilestone.clarity),
        evidenceRefs: [`roadmap:${topMilestone.id}`],
        confidenceScore: clamp(topMilestone.clarity),
        riskScore: clamp(100 - topMilestone.clarity),
        impactEstimate: Math.round(topMilestone.clarity * 2_800),
        investmentEstimate: Math.round(topMilestone.clarity * 1_200),
        experimentRefs,
        capabilitiesRequired: ["portfolio_governance", "strategy"],
        owner: "strategy",
        dueDate: dueMedium,
        rationale: topMilestone.narrative,
        action: `Resource and track ${topMilestone.title} for ${topMilestone.duePeriod}.`,
        lenses: topMilestone.lenses,
        narrative: topMilestone.narrative,
      });
    }

    for (const record of input.opportunities.slice(0, 2)) {
      recommendations.push({
        id: this.createId("inn-rec"),
        title: record.title,
        priority: record.priority,
        evidenceRefs: [`opportunity:${record.id}`],
        confidenceScore: clamp(record.score),
        riskScore: clamp(100 - record.score),
        impactEstimate: record.expectedImpact,
        investmentEstimate: record.investmentEstimate,
        experimentRefs,
        capabilitiesRequired: ["innovation_intelligence", "execution"],
        owner: record.lenses.capabilitiesRequired.split(",")[0]?.trim() || "strategy",
        dueDate: dueMedium,
        rationale: record.narrative,
        action: record.lenses.innovationOpportunityExists,
        lenses: record.lenses,
        narrative: record.narrative,
      });
    }

    void input.innovationPortfolio;

    return recommendations
      .sort((left, right) => right.impactEstimate - left.impactEstimate)
      .slice(0, 8);
  }
}

export class ExecutiveInnovationBriefGenerator implements ExecutiveInnovationBriefGeneratorContract {
  generate(input: Parameters<ExecutiveInnovationBriefGeneratorContract["generate"]>[0]): ExecutiveInnovationBrief {
    const topIdea = [...input.ideaManagement.ideas].sort((a, b) => b.score - a.score)[0]?.title ?? null;
    return {
      generatedAt: input.now.toISOString(),
      headline: `Innovation health ${Math.round(input.scores.healthScore.value)} — top idea ${topIdea ?? "none"}`,
      summary:
        input.request.question ??
        "Where should we innovate next, which experiments validate the bets, and how is the portfolio balanced?",
      healthScore: input.scores.healthScore.value,
      pipelineScore: input.scores.pipelineScore.value,
      experimentScore: input.scores.experimentScore.value,
      portfolioScore: input.scores.portfolioScore.value,
      radarScore: input.scores.radarScore.value,
      topRecommendations: input.recommendations.slice(0, 5).map((recommendation) => recommendation.title),
      topRisks: input.risks.slice(0, 5).map((risk) => risk.title),
      topOpportunities: input.opportunities.slice(0, 5).map((opportunity) => opportunity.title),
      topIdea,
      lenses: buildLens({
        innovationOpportunityExists: `${input.opportunities.length} innovation opportunities surfaced.`,
        evidenceSupports: `Confidence ${input.confidence.level}; idea velocity ${Math.round(input.ideaManagement.velocityScore)}.`,
        problemSolved: "Leadership visibility across ideation → experiment → portfolio → roadmap.",
        expectedImpact: `Pipeline ${Math.round(input.scores.pipelineScore.value)}; portfolio ${Math.round(input.scores.portfolioScore.value)}.`,
        investmentRequired: "Prioritized experiment and roadmap investment.",
        experimentsValidate: `${input.scores.experimentScore.value.toFixed(0)} experiment score.`,
        risksExist: `${input.risks.length} material innovation risks tracked.`,
        capabilitiesRequired: "Strategy, innovation ops, portfolio governance, experiment design",
      }),
      narrative: `Executive innovation brief: health ${Math.round(input.scores.healthScore.value)}, pipeline ${Math.round(input.scores.pipelineScore.value)}, confidence ${input.confidence.level}.`,
    };
  }
}

function score(key: string, label: string, value: number): InnovationScore {
  const normalized = clamp(value);
  const status = statusFromScore(normalized);
  return {
    key,
    label,
    value: normalized,
    status,
    band: priorityFromScore(normalized),
    narrative: scoreNarrative(label, normalized, status),
  };
}

function risk(
  createId: (prefix: string) => string,
  title: string,
  category: string,
  scoreValue: number,
  mitigation: string,
  problemSolved: string
): InnovationRiskRecord {
  return {
    id: createId("inn-risk"),
    title,
    category,
    severity: priorityFromRisk(scoreValue / 100),
    score: scoreValue,
    mitigation,
    lenses: buildLens({
      innovationOpportunityExists: `Mitigating ${title} protects innovation capacity.`,
      evidenceSupports: title,
      problemSolved,
      expectedImpact: "Reduced pipeline and portfolio risk.",
      investmentRequired: "Risk mitigation investment required.",
      experimentsValidate: "Targeted validation experiments.",
      risksExist: title,
      capabilitiesRequired: "Strategy and domain owners",
    }),
    narrative: title,
  };
}

function opportunity(
  createId: (prefix: string) => string,
  title: string,
  priority: InnovationOpportunityRecord["priority"],
  scoreValue: number,
  expectedImpact: number,
  investmentEstimate: number,
  owner: string
): InnovationOpportunityRecord {
  return {
    id: createId("inn-opp"),
    title,
    priority,
    score: scoreValue,
    expectedImpact,
    investmentEstimate,
    lenses: buildLens({
      innovationOpportunityExists: title,
      evidenceSupports: title,
      problemSolved: "Advances organizational innovation outcomes.",
      expectedImpact: `Expected impact ~$${expectedImpact.toLocaleString()}.`,
      investmentRequired: `Investment ~$${investmentEstimate.toLocaleString()}.`,
      experimentsValidate: "Scoped pilots and learning reviews.",
      risksExist: "Execution and adoption risk.",
      capabilitiesRequired: owner,
    }),
    narrative: title,
  };
}
