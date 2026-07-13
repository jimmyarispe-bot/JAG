/**
 * Part 3: projection, repository, registry, service, index, docs.
 */
import fs from "node:fs";
import path from "node:path";

const DEST = path.resolve("src/lib/platform/intelligence/systems");
const w = (name, content) => fs.writeFileSync(path.join(DEST, name), content, "utf8");

const AREAS = [
  "system_mapping", "dependency_analysis", "feedback_loop_analysis", "constraint_identification",
  "bottleneck_detection", "flow_optimization", "emergent_behavior", "network_dynamics",
  "organizational_complexity", "interdependency_modeling", "cascading_risk", "system_stability",
  "leverage_point_identification", "resource_flow", "adaptive_capacity", "system_evolution",
  "scenario_interaction",
];
const snakeToCamel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

// Fix types: networkDynamicsScore declared once (area camelCase doubles as engine score field)
const typesPath = path.join(DEST, "types.ts");
let types = fs.readFileSync(typesPath, "utf8");
// Remove duplicate networkDynamicsScore from engine score block if present twice
const dup = /networkDynamicsScore: SystemsScore;\n  forecastScore/;
if ((types.match(/networkDynamicsScore: SystemsScore;/g) || []).length > 1) {
  types = types.replace(
    /  networkDynamicsScore: SystemsScore;\n  forecastScore: SystemsScore; scenarioScore: SystemsScore; analysisScore: SystemsScore;\n  earlyWarningScore: SystemsScore;\n  dependencyScore: SystemsScore; feedbackLoopScore: SystemsScore;\n  bottleneckScore: SystemsScore; networkDynamicsScore: SystemsScore; constraintScore: SystemsScore;/,
    `  forecastScore: SystemsScore; scenarioScore: SystemsScore; analysisScore: SystemsScore;
  earlyWarningScore: SystemsScore;
  dependencyScore: SystemsScore; feedbackLoopScore: SystemsScore;
  bottleneckScore: SystemsScore; networkDynamicsScore: SystemsScore; constraintScore: SystemsScore;`
  );
  // That removed area networkDynamicsScore - we want to keep ONE. Better approach:
}
// Rewrite the score section cleanly
types = types.replace(
  /healthScore: SystemsScore;\n[\s\S]*?constraintScore: SystemsScore;\n  health: SystemsHealthScore;/,
  `healthScore: SystemsScore;
${AREAS.map(a => `  ${snakeToCamel(a)}Score: SystemsScore;`).join("\n")}
  forecastScore: SystemsScore; scenarioScore: SystemsScore; analysisScore: SystemsScore;
  earlyWarningScore: SystemsScore;
  dependencyScore: SystemsScore; feedbackLoopScore: SystemsScore;
  bottleneckScore: SystemsScore; constraintScore: SystemsScore;
  health: SystemsHealthScore;`
);
// Note: networkDynamicsScore comes from area camelCase (network_dynamics); engine score
// reuses the same field on the result object (assigned last from engine composeScores).
fs.writeFileSync(typesPath, types, "utf8");

// Fix systems-engine: assign area scores except networkDynamics (engine overwrites),
// and include networkDynamicsScore from engine scores only once.
let engine = fs.readFileSync(path.join(DEST, "systems-engine.ts"), "utf8");
const areaAssignNoNet = AREAS.filter(a => a !== "network_dynamics").map(a =>
  `      ${snakeToCamel(a)}Score: scores.areaScores.${a},`
).join("\n");
engine = engine.replace(
  /healthScore: scores\.healthScore,\n[\s\S]*?forecastScore: scores\.forecastScore,/,
  `healthScore: scores.healthScore,
${areaAssignNoNet}
      networkDynamicsScore: scores.networkDynamicsScore,
      forecastScore: scores.forecastScore,`
);
// Remove duplicate networkDynamicsScore line if engine block still has it
engine = engine.replace(
  /bottleneckScore: scores\.bottleneckScore,\n      networkDynamicsScore: scores\.networkDynamicsScore,\n      constraintScore: scores\.constraintScore,/,
  `bottleneckScore: scores.bottleneckScore,
      constraintScore: scores.constraintScore,`
);
fs.writeFileSync(path.join(DEST, "systems-engine.ts"), engine, "utf8");

w("projection.ts", `import { buildConfidence, outlookFromScore } from "@/lib/platform/intelligence/systems/models";
import type { SystemsProjectionResult, SystemsQueryRequest, SystemsQueryResult, SystemsResult } from "@/lib/platform/intelligence/systems/types";

export class SystemsProjection {
  project(input: Omit<SystemsProjectionResult, "forecast">): SystemsProjectionResult {
    const outlookBoost = input.outlook === "adaptive" ? 6 : input.outlook === "constrained" ? -4 : input.outlook === "stable" ? 2 : 0;
    return { ...input, forecast: Math.min(100, input.healthScore + outlookBoost) };
  }
}

export class SystemsQueries {
  ask(result: SystemsResult, request: SystemsQueryRequest): SystemsQueryResult {
    const focus = request.focus ?? "general";
    const max = request.maxResults ?? 5;
    let answer = result.brief.headline;
    let references: string[] = result.recommendations.slice(0, max).map(r => r.title);
    if (focus === "trends") { answer = result.trendSuite.narrative; references = result.trendSuite.trends.slice(0, max).map(t => t.title); }
    else if (focus === "forecasts") { answer = result.forecastSuite.narrative; references = result.forecastSuite.forecasts.slice(0, max).map(f => f.narrative); }
    else if (focus === "scenarios") { answer = result.scenarioSuite.narrative; references = result.scenarioSuite.scenarios.slice(0, max).map(s => s.title); }
    else if (focus === "analysis") { answer = result.analysisSuite.narrative; references = result.analysisSuite.analyses.slice(0, max).map(a => a.title); }
    else if (focus === "reasoning") { answer = result.reasoning.answer; references = result.reasoning.connectedForces.slice(0, max); }
    else if (focus === "learning") { answer = result.closedLearningLoop.narrative; references = result.closedLearningLoop.lessons.slice(0, max); }
    else if (focus === "early_warning") { answer = result.earlyWarningSuite.narrative; references = result.earlyWarningSuite.alerts.slice(0, max).map(a => a.title); }
    else if (focus === "recommendations") { answer = \`\${result.recommendations.length} systems recommendations.\`; }
    else if (focus in result.areaSuites) {
      const suite = result.areaSuites[focus as keyof typeof result.areaSuites];
      answer = suite.narrative;
      references = suite.records.slice(0, max).map(r => r.title);
    }
    return {
      question: request.question,
      focus,
      answer,
      references,
      confidence: buildConfidence([
        { key: "result", label: "Result confidence", contribution: result.confidence.value },
        { key: "focus", label: "Focus specificity", contribution: focus === "general" ? .6 : .85 },
      ]),
    };
  }
}

void outlookFromScore;
`);

w("repository.ts", `import type { SystemsRepository } from "@/lib/platform/intelligence/systems/contracts";
import type { SystemsHistoryRecord, SystemsResult, GraphScope } from "@/lib/platform/intelligence/systems/types";

export class SystemsRepositoryStore implements SystemsRepository {
  private results = new Map<string, SystemsResult>();
  private history: SystemsHistoryRecord[] = [];

  save(result: SystemsResult): SystemsResult {
    this.results.set(result.requestId, result);
    return result;
  }
  get(requestId: string): SystemsResult | null {
    return this.results.get(requestId) ?? null;
  }
  list(scope?: Partial<GraphScope>): SystemsResult[] {
    const all = [...this.results.values()];
    if (!scope) return all;
    return all.filter(r =>
      (scope.organizationId == null || r.scope.organizationId === scope.organizationId) &&
      (scope.schoolId == null || r.scope.schoolId === scope.schoolId)
    );
  }
  remove(requestId: string): boolean {
    return this.results.delete(requestId);
  }
  saveHistory(record: SystemsHistoryRecord): SystemsHistoryRecord {
    this.history.push(record);
    return record;
  }
  listHistory(scope?: Partial<GraphScope>): SystemsHistoryRecord[] {
    if (!scope) return [...this.history];
    return this.history.filter(r =>
      (scope.organizationId == null || r.scope.organizationId === scope.organizationId) &&
      (scope.schoolId == null || r.scope.schoolId === scope.schoolId)
    );
  }
  clear(): void {
    this.results.clear();
    this.history = [];
  }
}
`);

w("systems-registry.ts", `import type { SystemsRegistry } from "@/lib/platform/intelligence/systems/contracts";
import type { SystemsPublisher } from "@/lib/platform/intelligence/systems/types";

export class SystemsRegistryStore implements SystemsRegistry {
  private publishers: SystemsPublisher[] = [];

  register(domain: string, capability: string): void {
    if (!this.publishers.some(p => p.domain === domain && p.capability === capability)) {
      this.publishers.push({ domain, capability });
    }
  }
  list(): SystemsPublisher[] {
    return [...this.publishers];
  }
  isRegistered(domain: string): boolean {
    return this.publishers.some(p => p.domain === domain);
  }
  clear(): void {
    this.publishers = [];
  }
}
`);

w("service.ts", `import type { SystemsDependencies, SystemsIntelligenceService as Contract, SystemsRepository as Repository } from "@/lib/platform/intelligence/systems/contracts";
import { SystemsIntelligenceEngineImpl } from "@/lib/platform/intelligence/systems/systems-engine";
import type { SystemsQueryRequest, SystemsQueryResult, SystemsRequest, SystemsResult } from "@/lib/platform/intelligence/systems/types";

export interface SystemsServiceDependencies extends SystemsDependencies {}

export class SystemsIntelligenceServiceImpl implements Contract {
  private engine: SystemsIntelligenceEngineImpl;
  constructor(d: SystemsServiceDependencies = {}) {
    this.engine = (d.engine as SystemsIntelligenceEngineImpl | undefined) ?? new SystemsIntelligenceEngineImpl(d);
  }
  build(request: SystemsRequest): SystemsResult { return this.engine.build(request); }
  query(result: SystemsResult, request: SystemsQueryRequest): SystemsQueryResult { return this.engine.queries.ask(result, request); }
  repository(): Repository { return this.engine.repository; }
}

export {
  SystemsIntelligenceServiceImpl as SystemsIntelligenceService,
  SystemsIntelligenceServiceImpl as SystemsService,
  SystemsIntelligenceServiceImpl as SystemsServiceImpl,
};
`);

const areaExports = AREAS.map(a =>
  `export * from "@/lib/platform/intelligence/systems/${a.replaceAll("_", "-")}-intelligence";`
).join("\n");

w("index.ts", `export * from "@/lib/platform/intelligence/systems/types";
export type {
  SystemsDependencies,
  SystemsAreaIntelligence as SystemsAreaIntelligenceContract,
  SystemsForecastEngineContract,
  SystemsScenarioEngineContract,
  SystemsTrendEngineContract,
  SystemsAnalysisEngineContract,
  DependencyEngineContract,
  FeedbackLoopEngineContract,
  ConstraintEngineContract,
  BottleneckEngineContract,
  NetworkDynamicsEngineContract,
  EarlyWarningEngineContract,
  SystemsReasonerContract,
  SystemsRegistry as SystemsRegistryContract,
  SystemsRepository as SystemsRepositoryContract,
  SystemsEngine as SystemsEngineContract,
  SystemsIntelligenceEngine as SystemsIntelligenceEngineContract,
  SystemsIntelligenceService as SystemsIntelligenceServiceContract,
  SystemsService as SystemsServiceContract,
} from "@/lib/platform/intelligence/systems/contracts";
export * from "@/lib/platform/intelligence/systems/models";
export * from "@/lib/platform/intelligence/systems/area-factory";
${areaExports}
export * from "@/lib/platform/intelligence/systems/systems-forecast-engine";
export * from "@/lib/platform/intelligence/systems/systems-scenario-engine";
export * from "@/lib/platform/intelligence/systems/systems-trend-engine";
export * from "@/lib/platform/intelligence/systems/systems-analysis-engine";
export * from "@/lib/platform/intelligence/systems/dependency-engine";
export * from "@/lib/platform/intelligence/systems/feedback-loop-engine";
export * from "@/lib/platform/intelligence/systems/constraint-engine";
export * from "@/lib/platform/intelligence/systems/bottleneck-engine";
export * from "@/lib/platform/intelligence/systems/network-dynamics-engine";
export * from "@/lib/platform/intelligence/systems/early-warning-engine";
export * from "@/lib/platform/intelligence/systems/knowledge-contribution";
export * from "@/lib/platform/intelligence/systems/closed-learning-loop";
export * from "@/lib/platform/intelligence/systems/systems-reasoner";
export * from "@/lib/platform/intelligence/systems/systems-intelligence";
export * from "@/lib/platform/intelligence/systems/projection";
export * from "@/lib/platform/intelligence/systems/systems-registry";
export * from "@/lib/platform/intelligence/systems/repository";
export * from "@/lib/platform/intelligence/systems/systems-engine";
export * from "@/lib/platform/intelligence/systems/service";

import type { SystemsDependencies } from "@/lib/platform/intelligence/systems/contracts";
import { SystemsIntelligenceEngine } from "@/lib/platform/intelligence/systems/systems-engine";
import { SystemsIntelligenceService } from "@/lib/platform/intelligence/systems/service";
import {
  createOrganizationDnaIntelligence,
  type CreateOrganizationDnaOptions,
  type OrganizationDnaStack,
} from "@/lib/platform/intelligence/organization-dna";
import {
  createOiosOperatingSystem,
  type CreateOiosOptions,
  type OiosStack,
} from "@/lib/platform/oios";

export interface SystemsStack {
  service: SystemsIntelligenceService;
  engine: SystemsIntelligenceEngine;
  organizationDna: OrganizationDnaStack | null;
  oios: OiosStack | null;
}

export interface CreateSystemsOptions extends SystemsDependencies {
  organizationDna?: OrganizationDnaStack;
  organizationDnaOptions?: CreateOrganizationDnaOptions;
  wireOrganizationDna?: boolean;
  oios?: OiosStack;
  oiosOptions?: CreateOiosOptions;
  wireOios?: boolean;
}

export function createSystemsIntelligence(options: CreateSystemsOptions = {}): SystemsStack {
  const organizationDna =
    options.organizationDna ??
    (options.wireOrganizationDna === false
      ? null
      : createOrganizationDnaIntelligence({
          ...options.organizationDnaOptions,
          wireGraphAnalyzer: false,
          wireDecision: false,
          wirePredictive: false,
          wireBoardGovernance: false,
        }));
  const oios =
    options.oios ??
    (options.wireOios === false
      ? null
      : createOiosOperatingSystem({
          ...options.oiosOptions,
          organizationDnaStack: options.oiosOptions?.organizationDnaStack ?? organizationDna ?? undefined,
          wireOrganizationDna: false,
        }));
  const engine = new SystemsIntelligenceEngine(options);
  const service = new SystemsIntelligenceService({ ...options, engine });
  return { service, engine, organizationDna, oios };
}
`);

w("README.md", `# Systems Intelligence (Sprint 055)

**Version:** 0.1.0 | **Domain key:** \`systems\` | **ID prefix:** \`sys-\`

Seventeen-area organizational systems assessment for JAG. Map dependencies, feedback loops, constraints, and cascading effects so leadership can anticipate second- and third-order consequences of strategy - composing onto Ethical (054) without regenerating that package.

## Areas (17)

system_mapping, dependency_analysis, feedback_loop_analysis, constraint_identification, bottleneck_detection, flow_optimization, emergent_behavior, network_dynamics, organizational_complexity, interdependency_modeling, cascading_risk, system_stability, leverage_point_identification, resource_flow, adaptive_capacity, system_evolution, scenario_interaction

## Entry point

\`\`\`ts
import { createSystemsIntelligence } from "@/lib/platform/intelligence/systems";

const { service } = createSystemsIntelligence({ wireOrganizationDna: false, wireOios: false });
const result = service.build({ requestId: "sys-1", scope: { organizationId: "org-1", schoolId: "school-1" } });
\`\`\`

## Lens (8 fields)

dependencyImpact · bottleneckRisk · feedbackStability · systemComplexity · resourceFlow · cascadingRisk · adaptability · longTermSystemHealth

## Hard DAG

\`["ethical"]\` - terminal platform module after Ethical Intelligence.

## Layer

Internal/cross-cutting systems dynamics after Ethical - how dependencies, feedback, and cascading effects shape long-term organizational health.
`);

w("ARCHITECTURE.md", `# Systems Intelligence Architecture

## Placement

- Domain key: \`systems\`
- Pipeline: terminal after \`ethical\`
- Hard DAG: \`["ethical"]\`
- OIOS hard deps: \`["organization-dna", "ethical"]\`
- Soft reads: operations, legal-compliance-risk, predictive, executive-decision, economic, behavioral, ethical, opportunity

## Package layout

Leaf-safe \`types\` / \`contracts\`, \`models\`, area factory + 17 area modules, specialized engines (dependency, feedback-loop, constraint, bottleneck, network-dynamics, early-warning), standard forecast/trend/scenario/analysis engines, composers, projection, repository, registry, service, \`createSystemsIntelligence\`.

## Suites on SystemsResult

dependencySuite, feedbackLoopSuite, constraintSuite, bottleneckSuite, networkDynamicsSuite, earlyWarningSuite, plus trend/forecast/scenario/analysis suites.

## Closed learning

Destinations: operations, legal-compliance-risk, predictive, executive-decision, economic, behavioral, opportunity.
`);

w("VERIFICATION.md", `# Systems Intelligence Verification

## Commands

\`\`\`
npx tsc --noEmit
npx vitest run tests/unit/intelligence/systems.test.ts tests/unit/intelligence/ethical.test.ts tests/unit/intelligence/cultural.test.ts tests/unit/intelligence/infrastructure.test.ts tests/unit/intelligence/oios-core.test.ts
\`\`\`

## Checks

1. Result version is 0.1.0 with all area and engine scores populated.
2. Analysis kinds and scenarios cover SYSTEMS_ANALYSIS_KINDS / SYSTEMS_SCENARIOS.
3. Recommendations carry the eight-field SystemsLens; IDs use \`sys-\` prefix.
4. Closed learning destinations match the seven soft-integration domains.
5. Platform module order ends \`cultural\`, \`ethical\`, \`systems\`.
`);

w("CHANGELOG.md", `# Systems Intelligence Changelog

## 0.1.0 - Sprint 055

- Initial Systems Intelligence package (17 areas, 10 scenarios, 12 analysis kinds).
- Specialized engines: Dependency, FeedbackLoop, Constraint, Bottleneck, NetworkDynamics, EarlyWarning.
- Soft integrations from operations, legal-compliance-risk, predictive, decision, economic, behavioral, ethical, opportunity.
- Terminal platform module after Ethical Intelligence.
`);

console.log("Part 3 complete. Files:", fs.readdirSync(DEST).length);
