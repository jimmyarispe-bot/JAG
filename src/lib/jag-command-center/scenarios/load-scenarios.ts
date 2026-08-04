/**
 * Scenario Planner application loaders — Sprint 202.
 */

import {
  ScenarioService,
  SCENARIO_TEMPLATES,
  type DecisionWhatIfBranch,
  type DecisionWhatIfResult,
  type ScenarioComparison,
  type ScenarioInputs,
  type ScenarioKind,
  type ScenarioResult,
  type ScenarioRunSpec,
  listScenarioObservations,
} from "@/lib/platform/intelligence/scenarios";
import type { SimilarSituationView } from "@/lib/platform/intelligence/memory/index";
import { listOrganizationsForSession } from "@/lib/jag-business/organizations-view";
import { resolveSessionOrganization } from "@/lib/jag-platform/data-plane";
import type { JagPlatformSession } from "@/lib/jag-platform/session";
import { recordJagAuditEvent } from "../audit/store";
import { projectDecisionsFromExecutions } from "../decision-center/project";
import { listStoredExecutions } from "../intelligence-store";
import { loadSimilarSituations } from "../memory/load-memory";
import { scenarioStrategicImpact } from "../strategy/load-strategy";
import { buildScenarioBaseline } from "./build-baseline";

export { listScenarioObservations };

export type JagScenarioStrategicImpact = {
  readonly goalImpact: string;
  readonly missionImpact: string;
  readonly tradeOffs: readonly string[];
  readonly alignmentScore: number;
};

export type JagScenarioPlannerModel = {
  readonly organizationId: string | null;
  readonly organizationName: string | null;
  readonly organizations: readonly { id: string; label: string }[];
  readonly templates: typeof SCENARIO_TEMPLATES;
  readonly advisoryNotice: string;
  readonly results: readonly ScenarioResult[];
  readonly comparison: ScenarioComparison | null;
  readonly observationId: string | null;
  readonly explanation: string;
  readonly similarSituations: readonly SimilarSituationView[];
  readonly strategicImpact: JagScenarioStrategicImpact | null;
};

function decisionsForOrg(organizationId: string, organizationName: string) {
  return projectDecisionsFromExecutions({
    executions: listStoredExecutions(organizationId, 200),
    organizationNames: { [organizationId]: organizationName },
  });
}

export function loadScenarioPlanner(
  session: JagPlatformSession,
  options?: {
    readonly organizationId?: string;
    readonly runKinds?: readonly ScenarioKind[];
    readonly compare?: boolean;
  }
): JagScenarioPlannerModel {
  const organizations = listOrganizationsForSession(session);
  const organization = resolveSessionOrganization(
    session,
    options?.organizationId
  );

  const templates = SCENARIO_TEMPLATES;
  const advisoryNotice =
    "Scenario projections are advisory — not certainty. Separate observed facts, forecasts, and assumptions.";

  if (!organization) {
    return {
      organizationId: null,
      organizationName: null,
      organizations: [],
      templates,
      advisoryNotice,
      results: [],
      comparison: null,
      observationId: null,
      explanation: "Select an organization to plan scenarios.",
      similarSituations: [],
      strategicImpact: null,
    };
  }

  const kinds = options?.runKinds ?? [];
  if (kinds.length === 0) {
    return {
      organizationId: organization.id,
      organizationName: organization.name,
      organizations: organizations.map((o) => ({ id: o.id, label: o.name })),
      templates,
      advisoryNotice,
      results: [],
      comparison: null,
      observationId: null,
      explanation:
        "Choose one or more scenario templates to model hypothetical changes. Comparison shows Current vs selected options side-by-side.",
      similarSituations: [],
      strategicImpact: null,
    };
  }

  const decisions = decisionsForOrg(organization.id, organization.name);
  const baseline = buildScenarioBaseline({
    organizationId: organization.id,
    organizationName: organization.name,
    decisions,
  });

  const specs: ScenarioRunSpec[] = kinds.map((kind) => {
    const template = templates.find((t) => t.kind === kind)!;
    const inputs: ScenarioInputs = {
      organizationId: organization.id,
      organizationName: organization.name,
      domainId: "education",
      domainName: "Education",
      ...template.defaultInputs,
    };
    return { kind, inputs };
  });

  const response =
    options?.compare !== false && specs.length > 1
      ? ScenarioService.compare({ baseline, specs })
      : ScenarioService.run({
          baseline,
          specs,
          compare: specs.length > 1,
        });

  if (response.observationId) {
    recordJagAuditEvent({
      action: "scenario_run",
      actorUserId: session.userId,
      actorLabel: session.displayName,
      organizationId: organization.id,
      detail: `Scenario planner: ${specs.length} scenario(s), ${response.durationMs}ms${
        response.comparison ? ", comparison enabled" : ""
      }.`,
      metadata: {
        observationId: response.observationId,
        kinds: kinds.join(","),
      },
    });
  }

  const first = response.results[0];
  const similarSituations = first
    ? loadSimilarSituations({
        organizationId: organization.id,
        title: first.title,
        description: first.narrative,
        tags: [first.kind, "scenario"],
        type: "scenario",
        limit: 4,
      })
    : [];

  const strategicImpact = first
    ? scenarioStrategicImpact({
        organizationId: organization.id,
        organizationName: organization.name,
        scenarioTitle: first.title,
        scenarioSummary: first.narrative,
      })
    : null;

  return {
    organizationId: organization.id,
    organizationName: organization.name,
    organizations: organizations.map((o) => ({ id: o.id, label: o.name })),
    templates,
    advisoryNotice,
    results: response.results,
    comparison: response.comparison,
    observationId: response.observationId || null,
    explanation: `Ran ${response.results.length} advisory scenario(s) in ${response.durationMs}ms.`,
    similarSituations,
    strategicImpact,
  };
}

export function computeDecisionWhatIf(input: {
  readonly organizationId: string;
  readonly organizationName: string;
  readonly decisionId: string;
  readonly decisionTitle: string;
  readonly category?: string;
  readonly branch: DecisionWhatIfBranch;
  readonly observe?: boolean;
}): DecisionWhatIfResult {
  const decisions = decisionsForOrg(
    input.organizationId,
    input.organizationName
  );
  const baseline = buildScenarioBaseline({
    organizationId: input.organizationId,
    organizationName: input.organizationName,
    decisions,
  });
  return ScenarioService.decisionWhatIf({
    baseline,
    decisionId: input.decisionId,
    decisionTitle: input.decisionTitle,
    branch: input.branch,
    category: input.category,
    observe: input.observe ?? false,
  });
}

export function loadDecisionWhatIf(input: {
  readonly session: JagPlatformSession;
  readonly organizationId: string;
  readonly organizationName: string;
  readonly decisionId: string;
  readonly decisionTitle: string;
  readonly category?: string;
  readonly branch: DecisionWhatIfBranch;
}): DecisionWhatIfResult {
  const result = computeDecisionWhatIf({
    ...input,
    observe: true,
  });

  recordJagAuditEvent({
    action: "scenario_run",
    actorUserId: input.session.userId,
    actorLabel: input.session.displayName,
    organizationId: input.organizationId,
    decisionId: input.decisionId,
    detail: `Decision what-if (${input.branch}): ${input.decisionTitle}`,
    metadata: { branch: input.branch, scenarioId: result.scenario.id },
  });

  return result;
}

export function runBriefingScenarioAnalysis(input: {
  readonly organizationId: string;
  readonly organizationName: string;
}): {
  readonly results: readonly ScenarioResult[];
  readonly comparison: ScenarioComparison | null;
} {
  const decisions = decisionsForOrg(input.organizationId, input.organizationName);
  const baseline = buildScenarioBaseline({
    organizationId: input.organizationId,
    organizationName: input.organizationName,
    decisions,
  });
  const specs: ScenarioRunSpec[] = (
    ["teacher_hiring", "funding_reduction", "enrollment_growth"] as const
  ).map((kind) => {
    const template = SCENARIO_TEMPLATES.find((t) => t.kind === kind)!;
    return {
      kind,
      inputs: {
        organizationId: input.organizationId,
        organizationName: input.organizationName,
        ...template.defaultInputs,
      },
    };
  });
  const response = ScenarioService.compare({
    baseline,
    specs,
    observe: true,
  });
  return { results: response.results, comparison: response.comparison };
}
