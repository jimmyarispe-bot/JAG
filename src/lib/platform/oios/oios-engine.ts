/**
 * JAG OIOS Core — primary composition engine (Sprint 031).
 */

import type {
  OiosDependencies,
  OiosEngine as OiosEngineContract,
  OiosRepository as OiosRepositoryContract,
} from "@/lib/platform/oios/contracts";
import { ContinuousImprovementLoop } from "@/lib/platform/oios/continuous-improvement-loop";
import { IntelligenceDomainRegistry } from "@/lib/platform/oios/intelligence-domain-registry";
import { deriveOiosBaseline } from "@/lib/platform/oios/models";
import { OrganizationBenchmarking } from "@/lib/platform/oios/organization-benchmarking";
import { OrganizationCapabilitiesRegistry } from "@/lib/platform/oios/organization-capabilities-registry";
import { OrganizationConfiguration } from "@/lib/platform/oios/organization-configuration";
import { OrganizationExecutionModel } from "@/lib/platform/oios/organization-execution-model";
import { OrganizationGovernanceModel } from "@/lib/platform/oios/organization-governance-model";
import { OrganizationImprovementEngine } from "@/lib/platform/oios/organization-improvement-engine";
import { OrganizationMaturityModel } from "@/lib/platform/oios/organization-maturity-model";
import { OrganizationObjectives } from "@/lib/platform/oios/organization-objectives";
import { OrganizationOperatingModel } from "@/lib/platform/oios/organization-operating-model";
import { OrganizationScorecard } from "@/lib/platform/oios/organization-scorecard";
import { OrganizationStrategy } from "@/lib/platform/oios/organization-strategy";
import { OrganizationalContext } from "@/lib/platform/oios/organizational-context";
import { OrganizationalDigitalTwin } from "@/lib/platform/oios/organizational-digital-twin";
import { OrganizationalHealthIndex } from "@/lib/platform/oios/organizational-health-index";
import { OrganizationalKnowledgeGraph } from "@/lib/platform/oios/organizational-knowledge-graph";
import { OrganizationalLifecycle } from "@/lib/platform/oios/organizational-lifecycle";
import { OrganizationalMemory } from "@/lib/platform/oios/organizational-memory";
import { OrganizationalStateEngine } from "@/lib/platform/oios/organizational-state-engine";
import { OiosRepository } from "@/lib/platform/oios/repository";
import {
  OIOS_VERSION,
  type OiosProjectionResult,
  type OiosRequest,
  type OiosResult,
} from "@/lib/platform/oios/types";

export class OiosEngine implements OiosEngineContract {
  readonly registry = new IntelligenceDomainRegistry();
  readonly memory = new OrganizationalMemory();
  readonly knowledge = new OrganizationalKnowledgeGraph();

  private readonly now: () => Date;
  private readonly createId: (prefix: string) => string;
  private readonly repository: OiosRepositoryContract;
  private readonly organizationDna: OiosDependencies["organizationDna"];

  constructor(dependencies: OiosDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date());
    this.createId =
      dependencies.createId ??
      ((prefix) => `${prefix}-${this.now().getTime()}`);
    this.repository = dependencies.repository ?? new OiosRepository();
    this.organizationDna = dependencies.organizationDna;
  }

  build(request: OiosRequest): OiosResult {
    const generatedAt = this.now().toISOString();
    const enrichedDna =
      request.dnaResult ??
      (request.dnaSeed && this.organizationDna
        ? this.organizationDna(request)
        : null);
    const dna = enrichedDna?.dna ?? request.dna ?? null;
    const scope = request.scope ?? { organizationId: null, schoolId: null };
    const baseline = deriveOiosBaseline(dna, request.baselineOverrides);
    const lifecycle = new OrganizationalLifecycle().resolve(dna, baseline);
    const activeDomains = this.registry
      .list()
      .filter((domain) => domain.status === "active")
      .map((domain) => domain.domain);
    const state = new OrganizationalStateEngine().derive({
      lifecycle,
      baseline,
      activeDomains,
    });
    const health = new OrganizationalHealthIndex().assess(baseline);
    const capabilities = new OrganizationCapabilitiesRegistry(
      this.createId
    ).assess(baseline);
    const maturity = new OrganizationMaturityModel().assess(capabilities);
    const scorecard = new OrganizationScorecard(this.now).build(
      health,
      maturity,
      baseline
    );
    const opportunities = new OrganizationImprovementEngine(
      this.createId
    ).prioritize(capabilities);
    const improvementCycle = new ContinuousImprovementLoop(
      this.createId,
      this.now
    ).run(opportunities, health);
    const objectives = new OrganizationObjectives(this.createId).build(
      opportunities
    );
    const strategy = new OrganizationStrategy(this.createId).build(objectives);
    const twin = new OrganizationalDigitalTwin(this.now, this.createId).snapshot(
      {
        scope,
        state,
        signals: {
          health: health.score,
          maturity: maturity.score,
          ...scorecard.measures,
        },
        dna,
      }
    );
    const context = new OrganizationalContext(this.now).create({
      scope,
      baseline,
      state,
      dna,
    });
    const benchmarks = [
      new OrganizationBenchmarking().compare(scorecard),
      new OrganizationBenchmarking().compare(scorecard, 80),
    ];

    const memoryRecord = this.memory.remember({
      id: this.createId("memory"),
      scope,
      kind: "oios.build",
      content: `Built OIOS snapshot with ${health.band} health and ${maturity.level} maturity.`,
      createdAt: generatedAt,
      metadata: { requestId: request.requestId, score: scorecard.overall },
    });

    const orgNode = this.knowledge.addNode({
      id: this.createId("node"),
      label: dna?.profile.name ?? "Organization",
      kind: "organization",
      metadata: { stage: lifecycle },
    });
    const strategyNode = this.knowledge.addNode({
      id: this.createId("node"),
      label: strategy.title,
      kind: "strategy",
      metadata: { objectiveCount: strategy.objectives.length },
    });
    this.knowledge.addEdge({
      id: this.createId("edge"),
      fromId: orgNode.id,
      toId: strategyNode.id,
      relation: "pursues",
      weight: 1,
    });

    const historyRecord = {
      id: this.createId("history"),
      requestId: request.requestId,
      scope: { ...scope },
      generatedAt,
      summary: `OIOS ${health.band} health and ${maturity.level} maturity assessment.`,
      score: scorecard.overall,
    };

    const result: OiosResult = {
      requestId: request.requestId,
      version: OIOS_VERSION,
      generatedAt,
      scope,
      baseline,
      twin,
      context,
      health,
      maturity,
      scorecard,
      capabilities,
      opportunities,
      improvementCycle,
      strategy,
      execution: new OrganizationExecutionModel().build(strategy),
      operatingModel: new OrganizationOperatingModel().build(strategy),
      governance: new OrganizationGovernanceModel().build(),
      configuration: new OrganizationConfiguration(this.now).snapshot(),
      benchmarks,
      memory: [memoryRecord, ...this.memory.recall(scope)],
      knowledge: {
        nodes: this.knowledge.nodes(),
        edges: this.knowledge.edges(),
      },
      domains: this.registry.list(),
      dna,
      historyRecord,
    };

    this.repository.saveHistory(historyRecord);
    return this.repository.save(result);
  }

  project(result: OiosResult): OiosProjectionResult {
    return {
      headline: `Organization is ${result.health.band} with ${result.maturity.level} maturity.`,
      health: result.health.band,
      maturity: result.maturity.level,
      score: result.scorecard.overall,
      priorities: result.opportunities.slice(0, 3).map((item) => item.title),
    };
  }
}
