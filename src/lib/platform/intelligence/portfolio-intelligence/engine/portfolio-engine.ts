/**
 * Portfolio Intelligence orchestrator (Sprint 070).
 * Governs the organization's full initiative investment.
 */

import { AllocationEngine } from "@/lib/platform/intelligence/portfolio-intelligence/engine/allocation-engine";
import { CapacityEngine } from "@/lib/platform/intelligence/portfolio-intelligence/engine/capacity-engine";
import { OptimizationEngine } from "@/lib/platform/intelligence/portfolio-intelligence/engine/optimization-engine";
import { PortfolioHealthEngine } from "@/lib/platform/intelligence/portfolio-intelligence/engine/portfolio-health";
import { PrioritizationEngine } from "@/lib/platform/intelligence/portfolio-intelligence/engine/prioritization-engine";
import { detectCrossInitiativeDependencies } from "@/lib/platform/intelligence/portfolio-intelligence/planning/dependencies";
import { buildRoadmap } from "@/lib/platform/intelligence/portfolio-intelligence/planning/roadmap";
import { buildScenarios } from "@/lib/platform/intelligence/portfolio-intelligence/planning/scenarios";
import type {
  CapacitySnapshot,
  InitiativeLight,
  PortfolioAnalytics,
  PortfolioHealth,
  PortfolioRequest,
  PortfolioResult,
  PortfolioRegistry,
  PriorityScorecard,
} from "@/lib/platform/intelligence/portfolio-intelligence/types";
import { PORTFOLIO_INTELLIGENCE_VERSION } from "@/lib/platform/intelligence/portfolio-intelligence/types";

export interface PortfolioEngineDeps {
  createId?: (prefix: string) => string;
  now?: () => Date;
}

export class PortfolioEngine {
  private readonly createId: (prefix: string) => string;
  private readonly now: () => Date;
  private readonly prioritization: PrioritizationEngine;
  private readonly capacity: CapacityEngine;
  private readonly allocation: AllocationEngine;
  private readonly health: PortfolioHealthEngine;
  private readonly optimization: OptimizationEngine;

  constructor(deps: PortfolioEngineDeps = {}) {
    let seq = 0;
    this.createId = deps.createId ?? ((p) => `${p}-${++seq}`);
    this.now = deps.now ?? (() => new Date());
    this.prioritization = new PrioritizationEngine(this.now);
    this.capacity = new CapacityEngine();
    this.allocation = new AllocationEngine();
    this.health = new PortfolioHealthEngine();
    this.optimization = new OptimizationEngine(this.createId);
  }

  build(request: PortfolioRequest): PortfolioResult {
    const nowIso = this.now().toISOString();
    const initiatives = this.collectInitiatives(request);
    const scored = this.prioritization.scoreAll(initiatives, request);
    const prioritization = this.prioritization.ranked(scored);
    const capacity = this.capacity.assess(initiatives, prioritization);
    const allocations = this.allocation.allocate(initiatives, prioritization);
    const dependencies = detectCrossInitiativeDependencies(this.createId, initiatives);
    const health = this.health.calculate({
      initiatives,
      prioritization,
      capacity,
      dependencies,
    });
    const roadmap = buildRoadmap(initiatives, prioritization);
    const optimizations = this.optimization.recommend({
      prioritization,
      capacity,
      dependencies,
    });
    const analytics = this.analytics(initiatives, prioritization, capacity, health.strategicCoverage);
    const scenarios = buildScenarios({
      createId: this.createId,
      request,
      prioritization,
      capacity,
      analytics,
      predictive: request.predictiveResult,
    });
    const registry = this.registry(initiatives);

    const contributing = new Set<string>(["portfolio-intelligence", "initiative-intelligence"]);
    for (const d of request.initiativeResult?.contributingDomains ?? []) contributing.add(d);
    for (const d of request.briefingResult?.contributingDomains ?? []) contributing.add(d);
    for (const d of request.decisionResult?.contributingDomains ?? []) contributing.add(d);
    for (const d of request.predictiveResult?.contributingDomains ?? []) contributing.add(d);
    for (const d of request.autonomousResult?.contributingDomains ?? []) contributing.add(d);

    return {
      requestId: request.requestId,
      version: PORTFOLIO_INTELLIGENCE_VERSION,
      scope: request.scope,
      generatedAt: nowIso,
      registry,
      scored,
      prioritization,
      capacity,
      allocations,
      dependencies,
      health,
      roadmap,
      optimizations,
      scenarios,
      analytics,
      explainability: {
        executiveSummary: this.summarize(initiatives, health, prioritization, capacity),
        contributingDomains: [...contributing],
      },
      contributingDomains: [...contributing],
      metadata: {
        ...(request.metadata ?? {}),
        periodLabel: request.periodLabel,
        advisoryOptimizations: true,
        autoExecute: false,
      },
    };
  }

  private collectInitiatives(request: PortfolioRequest): InitiativeLight[] {
    const fromResult = request.initiativeResult?.initiatives ?? [];
    if (fromResult.length > 0) return fromResult;

    // Soft fallback from decision options when initiative stack empty.
    return (request.decisionResult?.recommendation?.rankedOptions ?? []).map((opt, i) => ({
      id: `decision-opt-${i}`,
      title: opt.title ?? `Option ${i + 1}`,
      executiveSummary: opt.title,
      state: "proposed",
      progress: { percentComplete: 0, healthScore: 55, healthStatus: "watch" },
      budget: { planned: 50_000, actual: 0, forecast: 50_000 },
      metadata: { source: "decision-intelligence" },
    }));
  }

  private registry(initiatives: InitiativeLight[]): PortfolioRegistry {
    const themes = [
      { id: this.createId("theme-growth"), name: "Growth", priority: 1 },
      { id: this.createId("theme-quality"), name: "Quality", priority: 2 },
      { id: this.createId("theme-efficiency"), name: "Efficiency", priority: 3 },
    ];
    const programs = themes.map((t) => ({
      id: this.createId(`prog-${t.name}`),
      name: `${t.name} program`,
      theme: t.name,
      initiativeIds: initiatives
        .filter((i) => {
          const cat = String(i.metadata?.category ?? i.title ?? "").toLowerCase();
          if (t.name === "Growth") return /enroll|campus|growth|market/.test(cat);
          if (t.name === "Quality") return /curriculum|reading|quality|accredit|teacher/.test(cat);
          return /cost|efficien|operat|ai|tech|grant/.test(cat);
        })
        .map((i, idx) => i.id ?? `init-${idx}`),
    }));

    return {
      id: this.createId("portfolio"),
      name: "Enterprise strategic portfolio",
      themes,
      programs,
      initiativeIds: initiatives.map((i, idx) => i.id ?? `init-${idx}`),
      totalBudgetPlanned: initiatives.reduce((acc, i) => acc + (i.budget?.planned ?? 0), 0),
      totalBudgetActual: initiatives.reduce((acc, i) => acc + (i.budget?.actual ?? 0), 0),
    };
  }

  private analytics(
    initiatives: InitiativeLight[],
    prioritization: PriorityScorecard[],
    capacity: CapacitySnapshot,
    strategicCoverage: number
  ): PortfolioAnalytics {
    const expectedRoi =
      prioritization.length === 0
        ? 0
        : Math.round(
            prioritization.reduce((acc, p) => acc + p.roi, 0) / prioritization.length
          );
    const portfolioValue = Math.round(
      initiatives.reduce((acc, i) => acc + (i.budget?.planned ?? 0), 0) * (expectedRoi / 100)
    );
    const aging =
      initiatives.length === 0
        ? 0
        : Math.round(
            initiatives.reduce((acc, i) => {
              const pct = i.progress?.percentComplete ?? 0;
              return acc + (pct < 100 ? 90 - pct : 0);
            }, 0) / initiatives.length
          );
    const completionTrend = Math.round(
      (initiatives.filter((i) => i.state === "completed").length /
        Math.max(1, initiatives.length)) *
        100
    );

    return {
      portfolioValue,
      expectedRoi,
      strategicCoverage,
      resourceUtilization: Math.round(
        (capacity.staffUtilization + capacity.budgetUtilization) / 2
      ),
      budgetAllocation: capacity.budgetUtilization,
      initiativeAgingDays: aging,
      completionTrend,
    };
  }

  private summarize(
    initiatives: InitiativeLight[],
    health: PortfolioHealth,
    prioritization: PriorityScorecard[],
    capacity: CapacitySnapshot
  ): string {
    const top = prioritization[0]?.title ?? "none";
    return `${initiatives.length} initiative(s) in portfolio — health ${health.state} (${health.value}). Top priority: ${top}.${capacity.overcommitted ? " Capacity overcommitted." : ""}`;
  }
}
