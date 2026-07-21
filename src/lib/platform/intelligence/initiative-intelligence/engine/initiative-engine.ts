/**
 * Initiative Intelligence orchestrator (Sprint 069).
 * Transforms approved recommendations into living strategic initiatives.
 */

import { DependencyEngine } from "@/lib/platform/intelligence/initiative-intelligence/engine/dependency-engine";
import { LifecycleEngine } from "@/lib/platform/intelligence/initiative-intelligence/engine/lifecycle-engine";
import { OutcomeEngine } from "@/lib/platform/intelligence/initiative-intelligence/engine/outcome-engine";
import { ProgressEngine } from "@/lib/platform/intelligence/initiative-intelligence/engine/progress-engine";
import { buildBudget } from "@/lib/platform/intelligence/initiative-intelligence/planning/budget";
import { buildDefaultKpis } from "@/lib/platform/intelligence/initiative-intelligence/planning/kpis";
import { buildDefaultMilestones } from "@/lib/platform/intelligence/initiative-intelligence/planning/milestones";
import {
  buildExpectedOutcomes,
  buildObjective,
} from "@/lib/platform/intelligence/initiative-intelligence/planning/objectives";
import { ownersForCategory } from "@/lib/platform/intelligence/initiative-intelligence/planning/owners";
import { buildRisk } from "@/lib/platform/intelligence/initiative-intelligence/tracking/risks";
import {
  emptyProgress,
  healthStatusFromScore,
} from "@/lib/platform/intelligence/initiative-intelligence/tracking/health";
import type {
  Initiative,
  InitiativeHealthStatus,
  InitiativeLink,
  InitiativeRequest,
  InitiativeResult,
  InitiativeLifecycleState,
} from "@/lib/platform/intelligence/initiative-intelligence/types";
import { INITIATIVE_INTELLIGENCE_VERSION } from "@/lib/platform/intelligence/initiative-intelligence/types";

export interface InitiativeEngineDeps {
  createId?: (prefix: string) => string;
  now?: () => Date;
}

export class InitiativeEngine {
  private readonly createId: (prefix: string) => string;
  private readonly now: () => Date;
  private readonly lifecycle: LifecycleEngine;
  private readonly progress: ProgressEngine;
  private readonly outcomes: OutcomeEngine;
  private readonly dependencies: DependencyEngine;

  constructor(deps: InitiativeEngineDeps = {}) {
    let seq = 0;
    this.createId = deps.createId ?? ((p) => `${p}-${++seq}`);
    this.now = deps.now ?? (() => new Date());
    this.lifecycle = new LifecycleEngine(this.createId, this.now);
    this.progress = new ProgressEngine(this.now);
    this.outcomes = new OutcomeEngine(this.now);
    this.dependencies = new DependencyEngine();
  }

  build(request: InitiativeRequest): InitiativeResult {
    const nowIso = this.now().toISOString();
    const fromSeeds = (request.seeds ?? []).map((seed) =>
      this.hydrateSeed(seed, request, nowIso)
    );
    const derived = this.deriveFromStack(request, nowIso);
    let initiatives = [...fromSeeds, ...derived];

    // Deduplicate by title.
    const seen = new Set<string>();
    initiatives = initiatives.filter((i) => {
      const key = i.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    initiatives = initiatives.map((i) => this.refreshProgress(i));

    const activeCount = initiatives.filter((i) =>
      ["active", "planned", "approved", "at_risk"].includes(i.state)
    ).length;
    const atRiskCount = initiatives.filter(
      (i) => i.state === "at_risk" || i.progress.healthStatus === "at_risk" || i.progress.healthStatus === "critical"
    ).length;
    const completedCount = initiatives.filter((i) => i.state === "completed").length;

    const avgHealth =
      initiatives.length === 0
        ? 50
        : Math.round(
            initiatives.reduce((acc, i) => acc + i.progress.healthScore, 0) /
              initiatives.length
          );
    const portfolioLabel = healthStatusFromScore(avgHealth);

    const memoryLessons = initiatives
      .filter((i) => i.outcome?.persistedToMemory)
      .flatMap((i) =>
        (i.outcome?.lessonsLearned ?? []).map((lesson) => ({
          initiativeId: i.id,
          lesson,
        }))
      );

    const contributing = new Set<string>(["initiative-intelligence"]);
    for (const d of request.briefingResult?.contributingDomains ?? []) contributing.add(d);
    for (const d of request.decisionResult?.contributingDomains ?? []) contributing.add(d);
    for (const d of request.predictiveResult?.contributingDomains ?? []) contributing.add(d);
    for (const d of request.autonomousResult?.contributingDomains ?? []) contributing.add(d);
    for (const d of request.copilotResult?.contributingDomains ?? []) contributing.add(d);
    for (const d of request.memoryResult?.contributingDomains ?? []) contributing.add(d);
    for (const d of request.commandCenterResult?.contributingDomains ?? []) contributing.add(d);
    contributing.add("executive-command-center");

    return {
      requestId: request.requestId,
      version: INITIATIVE_INTELLIGENCE_VERSION,
      scope: request.scope,
      generatedAt: nowIso,
      initiatives,
      activeCount,
      atRiskCount,
      completedCount,
      portfolioHealth: { value: avgHealth, label: portfolioLabel },
      explainability: {
        executiveSummary: this.summarize(initiatives, activeCount, atRiskCount),
        contributingDomains: [...contributing],
      },
      memoryLessons,
      contributingDomains: [...contributing],
      metadata: {
        ...(request.metadata ?? {}),
        periodLabel: request.periodLabel,
        dependencyIssues: initiatives.flatMap((i) => this.dependencies.resolve(i)),
      },
    };
  }

  transition(
    initiative: Initiative,
    to: InitiativeLifecycleState,
    actorRole: InitiativeRequest["actorRole"] = "system",
    rationale?: string
  ): Initiative {
    let next = this.lifecycle.transition(initiative, to, actorRole, rationale);
    if (to === "completed") {
      next = { ...next, outcome: this.outcomes.measure(next) };
    }
    return this.refreshProgress(next);
  }

  private refreshProgress(initiative: Initiative): Initiative {
    return {
      ...initiative,
      progress: this.progress.calculate(initiative),
      updatedAt: this.now().toISOString(),
    };
  }

  private hydrateSeed(
    seed: Partial<Initiative>,
    request: InitiativeRequest,
    nowIso: string
  ): Initiative {
    const title = seed.title ?? "Strategic initiative";
    const state = seed.state ?? "proposed";
    const base: Initiative = {
      id: seed.id ?? this.createId("init"),
      title,
      executiveSummary: seed.executiveSummary ?? title,
      businessCase: seed.businessCase ?? seed.executiveSummary ?? title,
      state,
      objective:
        seed.objective ??
        buildObjective(this.createId, { title, summary: seed.executiveSummary ?? title }),
      expectedOutcomes: seed.expectedOutcomes ?? buildExpectedOutcomes(this.createId, [title]),
      kpis: seed.kpis ?? buildDefaultKpis(this.createId, title),
      targetCompletionDate: seed.targetCompletionDate,
      owners: seed.owners ?? ownersForCategory(),
      budget: seed.budget ?? buildBudget(),
      milestones: seed.milestones ?? buildDefaultMilestones(this.createId, title, seed.targetCompletionDate),
      risks: seed.risks ?? [],
      blockers: seed.blockers ?? [],
      links: seed.links ?? this.defaultLinks(request),
      progress: seed.progress ?? emptyProgress(),
      transitions: seed.transitions ?? [this.lifecycle.seedTransition(state, request.actorRole ?? "system")],
      outcome: seed.outcome,
      createdAt: seed.createdAt ?? nowIso,
      updatedAt: nowIso,
      metadata: seed.metadata ?? {},
    };
    return base;
  }

  private deriveFromStack(request: InitiativeRequest, nowIso: string): Initiative[] {
    const out: Initiative[] = [];
    const options = request.decisionResult?.recommendation?.rankedOptions ?? [];
    for (const opt of options.slice(0, 3)) {
      const title = opt.title ?? "Approved recommendation";
      const summary =
        opt.summary ??
        request.decisionResult?.recommendation?.executiveSummary ??
        title;
      out.push(
        this.hydrateSeed(
          {
            title,
            executiveSummary: summary,
            businessCase: summary,
            state: "approved",
            targetCompletionDate: this.defaultTarget(nowIso, 90),
            budget: buildBudget({ roiHint: opt.scorecard?.roi ?? opt.confidence ?? 50 }),
            risks: (request.briefingResult?.briefing?.sections?.topRisks ?? [])
              .slice(0, 2)
              .map((r) =>
                buildRisk(this.createId, {
                  title: r.title ?? "Risk",
                  summary: r.summary ?? "",
                  severity: r.severity ?? 50,
                  likelihood: 55,
                })
              ),
            links: this.defaultLinks(request, {
              decisionId: request.decisionResult?.recommendation?.id,
              optionId: opt.id,
            }),
            metadata: { category: opt.category, source: "decision-intelligence" },
          },
          request,
          nowIso
        )
      );
    }

    for (const plan of (request.autonomousResult?.plans ?? []).slice(0, 2)) {
      const title = plan.optionTitle ?? plan.objective ?? "Execution plan initiative";
      if (out.some((i) => i.title.toLowerCase() === title.toLowerCase())) continue;
      out.push(
        this.hydrateSeed(
          {
            title,
            executiveSummary: plan.objective ?? title,
            businessCase: plan.objective ?? title,
            state: plan.readiness === "ready" ? "planned" : "proposed",
            links: [
              ...this.defaultLinks(request),
              {
                kind: "autonomous_plan",
                refId: plan.id ?? this.createId("plan-ref"),
                label: title,
                domain: "executive-autonomous",
              },
            ],
            metadata: { source: "executive-autonomous" },
          },
          request,
          nowIso
        )
      );
    }

    for (const opp of (request.briefingResult?.briefing?.sections?.topOpportunities ?? []).slice(
      0,
      1
    )) {
      const title = opp.title ?? "Strategic opportunity";
      if (out.some((i) => i.title.toLowerCase() === title.toLowerCase())) continue;
      out.push(
        this.hydrateSeed(
          {
            title,
            executiveSummary: opp.summary ?? title,
            businessCase: opp.summary ?? title,
            state: "proposed",
            links: [
              ...this.defaultLinks(request),
              {
                kind: "brief",
                refId: opp.id ?? this.createId("brief-ref"),
                label: title,
                domain: "briefing",
              },
            ],
            metadata: { source: "briefing", estimatedImpact: opp.estimatedImpact },
          },
          request,
          nowIso
        )
      );
    }

    return out;
  }

  private defaultLinks(
    request: InitiativeRequest,
    extra?: { decisionId?: string; optionId?: string }
  ): InitiativeLink[] {
    const links: InitiativeLink[] = [];
    if (extra?.decisionId) {
      links.push({
        kind: "decision",
        refId: extra.decisionId,
        label: "Source decision",
        domain: "decision-intelligence",
      });
    }
    if (extra?.optionId) {
      links.push({
        kind: "decision",
        refId: extra.optionId,
        label: "Ranked option",
        domain: "decision-intelligence",
      });
    }
    if (request.copilotResult?.explainability?.executiveSummary || request.copilotResult?.answer) {
      links.push({
        kind: "copilot_investigation",
        refId: request.requestId,
        label: "Copilot context",
        domain: "executive-copilot",
      });
    }
    if (request.predictiveResult?.forecasts?.length) {
      links.push({
        kind: "prediction",
        refId: `${request.requestId}-forecast`,
        label: "Predictive forecasts",
        domain: "executive-predictive",
      });
    }
    if (request.memoryResult) {
      links.push({
        kind: "executive_memory",
        refId: `${request.requestId}-memory`,
        label: "Executive memory",
        domain: "executive-memory",
      });
    }
    links.push({
      kind: "command_center",
      refId: `${request.requestId}-ecc`,
      label: "Executive Command Center",
      domain: "executive-command-center",
    });
    return links;
  }

  private defaultTarget(nowIso: string, days: number): string {
    const d = new Date(nowIso);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString();
  }

  private summarize(
    initiatives: Initiative[],
    activeCount: number,
    atRiskCount: number
  ): string {
    if (initiatives.length === 0) {
      return "No initiatives derived from the executive stack yet.";
    }
    return `${initiatives.length} initiative(s): ${activeCount} active/pipeline, ${atRiskCount} at risk. Portfolio tracks measurable change from brief → decision → execution → memory.`;
  }
}

export type { InitiativeHealthStatus };
