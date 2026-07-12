/**
 * Executive Decision Intelligence — RecommendationEngine (Sprint 026).
 */

import type {
  DecisionConfidence as DecisionConfidenceContract,
  RecommendationEngine as RecommendationEngineContract,
} from "@/lib/platform/intelligence/executive-decision/contracts";
import { DecisionConfidenceEngine } from "@/lib/platform/intelligence/executive-decision/confidence";
import {
  clamp01,
  priorityBandFromScore,
} from "@/lib/platform/intelligence/executive-decision/scoring";
import type {
  DecisionBaseline,
  DecisionDependencyItem,
  DecisionEvidenceItem,
  DecisionRiskItem,
  ExecutiveDecisionRecommendation,
  ExecutiveDecisionRequest,
  ScenarioSimulationResult,
} from "@/lib/platform/intelligence/executive-decision/types";
import type { GraphAnalysisResult } from "@/lib/platform/intelligence/executive-graph/types";

export interface RecommendationEngineDependencies {
  confidence?: DecisionConfidenceContract;
  createId?: (prefix: string) => string;
}

/**
 * RecommendationEngine — produces full executive recommendations with
 * summary, evidence, impacts, risks, dependencies, and confidence.
 */
export class RecommendationEngineImpl implements RecommendationEngineContract {
  private readonly confidence: DecisionConfidenceContract;
  private readonly createId: (prefix: string) => string;

  constructor(dependencies: RecommendationEngineDependencies = {}) {
    this.confidence = dependencies.confidence ?? new DecisionConfidenceEngine();
    this.createId =
      dependencies.createId ??
      ((prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  }

  generate(input: {
    request: ExecutiveDecisionRequest;
    baseline: DecisionBaseline;
    simulations: ScenarioSimulationResult[];
    analysis: GraphAnalysisResult | null;
    maxRecommendations?: number;
  }): ExecutiveDecisionRecommendation[] {
    const { request, baseline, simulations, analysis } = input;
    const max = input.maxRecommendations ?? request.maxRecommendations ?? 5;
    const recommendations: ExecutiveDecisionRecommendation[] = [];

    for (const simulation of simulations) {
      recommendations.push(this.fromSimulation(request, baseline, simulation, analysis));
    }

    // Surface top graph recommendations as decision options when available
    if (analysis) {
      for (const graphRec of analysis.recommendations.slice(0, 3)) {
        recommendations.push(this.fromGraphRecommendation(request, baseline, analysis, graphRec.id, graphRec.title, graphRec.action, graphRec.reason, graphRec.confidence, graphRec.expectedImpact));
      }
    }

    return recommendations
      .sort((a, b) => b.expectedRoi - a.expectedRoi || b.confidenceScore.value - a.confidenceScore.value)
      .slice(0, max);
  }

  private fromSimulation(
    request: ExecutiveDecisionRequest,
    baseline: DecisionBaseline,
    simulation: ScenarioSimulationResult,
    analysis: GraphAnalysisResult | null
  ): ExecutiveDecisionRecommendation {
    const { scenario, forecast, tradeoffs, strategy } = simulation;
    const action = resolveAction(scenario, tradeoffs?.preferredOption ?? null, strategy);
    const evidence = collectEvidence(simulation, analysis);
    const risks = collectRisks(simulation, analysis, this.createId);
    const dependencies = collectDependencies(simulation, analysis, this.createId);

    const score = clamp01(
      0.35 * (forecast.financial.roi > 0 ? Math.min(1, forecast.financial.roi) : 0) +
        0.25 * (1 - forecast.projected.overallRisk) +
        0.2 * simulation.confidence.value +
        0.2 * clamp01(forecast.mission.studentOutcomeDelta + 0.5)
    );

    const confidenceScore = this.confidence.score([
      {
        key: "simulation",
        label: "Simulation confidence",
        contribution: simulation.confidence.value * 0.45,
      },
      {
        key: "evidence_weight",
        label: "Evidence weight",
        contribution: Math.min(0.3, evidence.reduce((s, e) => s + e.weight, 0) / 4),
      },
      {
        key: "risk_clarity",
        label: "Risk clarity",
        contribution: risks.length > 0 ? 0.15 : 0.08,
      },
      {
        key: "graph",
        label: "Graph support",
        contribution: analysis ? 0.1 : 0.05,
      },
    ]);

    return {
      id: this.createId("rec"),
      title: scenario.title,
      action,
      priority: priorityBandFromScore(score),
      timing: tradeoffs?.preferredOption
        ? (["immediate", "near_term", "deferred", "conditional"].includes(
            tradeoffs.preferredOption
          )
            ? (tradeoffs.preferredOption as ExecutiveDecisionRecommendation["timing"])
            : scenario.timing ?? "near_term")
        : scenario.timing ?? "near_term",
      executiveSummary: buildExecutiveSummary(request.question, scenario, forecast, action),
      supportingEvidence: evidence,
      financialImpact: forecast.financial,
      operationalImpact: forecast.operational,
      missionImpact: forecast.mission,
      risks,
      dependencies,
      confidenceScore,
      expectedRoi: forecast.financial.roi,
      relatedScenarioIds: [scenario.id],
      relatedGraphRecommendationIds: simulation.graphDerived.graphRecommendationIds,
      metadata: {
        scenarioKind: scenario.kind,
        preferredTiming: tradeoffs?.preferredOption ?? null,
        recommendedInitiativeId: strategy?.recommendedInitiativeId ?? null,
        baselineEnrollment: baseline.enrollment,
      },
    };
  }

  private fromGraphRecommendation(
    request: ExecutiveDecisionRequest,
    baseline: DecisionBaseline,
    analysis: GraphAnalysisResult,
    graphRecId: string,
    title: string,
    action: string,
    reason: string,
    confidence: number,
    expectedImpact: string
  ): ExecutiveDecisionRecommendation {
    const opportunityLift =
      analysis.opportunities[0]?.estimatedLift ?? analysis.dashboard.overallOpportunity;
    const investment = Math.max(baseline.revenue * 0.05, 1);
    const expectedReturn = investment * (1 + opportunityLift);
    const roi = (expectedReturn - investment) / investment;

    const evidence: DecisionEvidenceItem[] = [
      {
        id: this.createId("ev"),
        label: "Graph recommendation",
        detail: reason,
        source: "executive_graph",
        weight: 0.8,
      },
      {
        id: this.createId("ev"),
        label: "Dashboard headline",
        detail: analysis.dashboard.headline,
        source: "executive_graph",
        weight: 0.6,
      },
    ];

    return {
      id: this.createId("rec"),
      title,
      action,
      priority: priorityBandFromScore(confidence),
      timing: "near_term",
      executiveSummary: `${request.question} Graph-backed action: ${action}. ${expectedImpact}`,
      supportingEvidence: evidence,
      financialImpact: {
        revenueDelta: expectedReturn - investment,
        costDelta: investment,
        netDelta: expectedReturn - investment * 2,
        roi,
        paybackMonths: 12,
        narrative: expectedImpact,
      },
      operationalImpact: {
        capacityDelta: opportunityLift * 0.2,
        staffingDelta: 0,
        serviceLevelDelta: opportunityLift * 0.15,
        narrative: `Operational lift estimated at ${(opportunityLift * 100).toFixed(0)}% opportunity pressure.`,
      },
      missionImpact: {
        studentOutcomeDelta: opportunityLift * 0.25,
        communityDelta: opportunityLift * 0.1,
        brandDelta: opportunityLift * 0.1,
        narrative: "Mission impact derived from graph opportunity signals.",
      },
      risks: analysis.risks.slice(0, 3).map((r, i) => ({
        id: this.createId("risk"),
        title: `Graph risk ${i + 1}`,
        category: "general" as const,
        probability: clamp01(r.totalRisk),
        impact: clamp01(r.totalRisk),
        score: clamp01(r.totalRisk),
        mitigation: "Monitor cascade path and re-simulate after mitigation.",
        relatedNodeIds: r.affectedNodeIds.slice(0, 5),
      })),
      dependencies: analysis.constraints.slice(0, 3).map((c) => ({
        id: this.createId("dep"),
        title: c.title,
        required: c.severity === "critical" || c.severity === "high",
        status: "unmet" as const,
        relatedNodeIds: [c.nodeId, ...c.blockedNodeIds.slice(0, 3)],
        narrative: c.description,
      })),
      confidenceScore: this.confidence.fromValue(confidence),
      expectedRoi: roi,
      relatedScenarioIds: [],
      relatedGraphRecommendationIds: [graphRecId],
      metadata: { source: "executive_graph" },
    };
  }
}

function resolveAction(
  scenario: ScenarioSimulationResult["scenario"],
  preferredTiming: string | null,
  strategy: ScenarioSimulationResult["strategy"]
): string {
  if (strategy?.recommendedInitiativeId) {
    const ranked = strategy.rankings.find(
      (r) => r.initiativeId === strategy.recommendedInitiativeId
    );
    return ranked
      ? `Pursue "${ranked.title}" (rank #${ranked.rank})`
      : `Pursue initiative ${strategy.recommendedInitiativeId}`;
  }
  if (scenario.kind === "hiring_timing") {
    return preferredTiming === "deferred"
      ? "Defer hiring until financial/enrollment pressure eases"
      : "Hire now to protect capacity and service levels";
  }
  if (scenario.kind === "campus_expansion") {
    return forecastSuggestsExpansion(scenario)
      ? "Proceed with campus expansion under staged capital plan"
      : "Do not open another campus until risk-adjusted ROI improves";
  }
  if (scenario.kind === "enrollment_drop") {
    return "Activate enrollment recovery plan and protect cash collections";
  }
  if (scenario.kind === "payroll_increase") {
    return "Contain payroll growth or offset with revenue/efficiency levers";
  }
  return `Execute scenario response for: ${scenario.title}`;
}

function forecastSuggestsExpansion(
  scenario: ScenarioSimulationResult["scenario"]
): boolean {
  const initiative = scenario.initiatives?.[0];
  if (!initiative) return false;
  return initiative.expectedReturn > initiative.investment * 1.15;
}

function buildExecutiveSummary(
  question: string,
  scenario: ScenarioSimulationResult["scenario"],
  forecast: ScenarioSimulationResult["forecast"],
  action: string
): string {
  return `${question} Under "${scenario.title}", net financial impact is ${forecast.financial.netDelta.toFixed(0)} with enrollment Δ ${(forecast.projected.enrollment - forecast.baseline.enrollment).toFixed(1)}. Recommended action: ${action}.`;
}

function collectEvidence(
  simulation: ScenarioSimulationResult,
  analysis: GraphAnalysisResult | null
): DecisionEvidenceItem[] {
  const items: DecisionEvidenceItem[] = [
    {
      id: `ev-${simulation.scenario.id}-forecast`,
      label: "Impact forecast",
      detail: simulation.forecast.summary,
      source: "scenario",
      weight: 0.9,
    },
  ];

  if (analysis) {
    items.push({
      id: `ev-${simulation.scenario.id}-dashboard`,
      label: "Executive graph dashboard",
      detail: analysis.dashboard.headline,
      source: "executive_graph",
      weight: 0.75,
    });
    for (const root of analysis.rootCauses.slice(0, 2)) {
      items.push({
        id: `ev-${root.id}`,
        label: `Root cause: ${root.label}`,
        detail: root.summary,
        source: "executive_graph",
        weight: 0.65,
        nodeIds: [root.nodeId],
      });
    }
    if (analysis.opportunities[0]) {
      items.push({
        id: `ev-${analysis.opportunities[0].id}`,
        label: analysis.opportunities[0].title,
        detail: analysis.opportunities[0].description,
        source: "founder",
        weight: 0.55,
        nodeIds: [analysis.opportunities[0].nodeId],
      });
    }
  }

  if (simulation.strategy?.recommendedInitiativeId) {
    items.push({
      id: `ev-strategy-${simulation.strategy.recommendedInitiativeId}`,
      label: "Strategy ranking",
      detail: simulation.strategy.summary,
      source: "strategy",
      weight: 0.7,
    });
  }

  return items;
}

function collectRisks(
  simulation: ScenarioSimulationResult,
  analysis: GraphAnalysisResult | null,
  createId: (prefix: string) => string
): DecisionRiskItem[] {
  const risks: DecisionRiskItem[] = [];
  const projected = simulation.forecast.projected;
  const baseline = simulation.forecast.baseline;

  if (projected.overallRisk > baseline.overallRisk) {
    risks.push({
      id: createId("risk"),
      title: "Elevated organizational risk",
      category: "general",
      probability: clamp01(projected.overallRisk),
      impact: clamp01(projected.overallRisk),
      score: clamp01(projected.overallRisk),
      mitigation: "Stage the decision and re-run simulation after mitigation actions.",
      relatedNodeIds: simulation.graphDerived.riskOriginIds.slice(0, 4),
    });
  }

  if (simulation.forecast.financial.netDelta < 0) {
    risks.push({
      id: createId("risk"),
      title: "Negative net financial impact",
      category: "financial",
      probability: 0.7,
      impact: clamp01(Math.abs(simulation.forecast.financial.netDelta) / Math.max(baseline.revenue, 1)),
      score: clamp01(Math.abs(simulation.forecast.financial.roi)),
      mitigation: "Offset costs with collections, pricing, or deferred spend.",
      relatedNodeIds: [],
    });
  }

  for (const risk of analysis?.risks.slice(0, 3) ?? []) {
    risks.push({
      id: createId("risk"),
      title: risk.summary.slice(0, 80) || "Graph-propagated risk",
      category: "operational",
      probability: clamp01(risk.totalRisk),
      impact: clamp01(risk.totalRisk),
      score: clamp01(risk.totalRisk),
      relatedNodeIds: risk.affectedNodeIds.slice(0, 5),
    });
  }

  return risks;
}

function collectDependencies(
  simulation: ScenarioSimulationResult,
  analysis: GraphAnalysisResult | null,
  createId: (prefix: string) => string
): DecisionDependencyItem[] {
  const deps: DecisionDependencyItem[] = [];

  for (const initiative of simulation.scenario.initiatives ?? []) {
    for (const dep of initiative.dependencies) {
      deps.push({
        id: createId("dep"),
        title: dep,
        required: true,
        status: "unknown",
        relatedNodeIds: [],
        narrative: `Required for initiative "${initiative.title}".`,
      });
    }
  }

  for (const constraint of analysis?.constraints.slice(0, 4) ?? []) {
    deps.push({
      id: createId("dep"),
      title: constraint.title,
      required: constraint.severity === "critical" || constraint.severity === "high",
      status: "unmet",
      relatedNodeIds: [constraint.nodeId],
      narrative: constraint.description,
    });
  }

  return deps;
}

/** Alias matching Sprint 026 naming. */
export { RecommendationEngineImpl as RecommendationEngine };
