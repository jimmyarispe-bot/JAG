/**
 * Application-facing ScenarioService — Sprint 202.
 */

import { runScenarioEngine } from "./ScenarioEngine";
import { ScenarioRegistry } from "./ScenarioRegistry";
import type {
  DecisionWhatIfBranch,
  DecisionWhatIfResult,
  ScenarioResult,
} from "./ScenarioResult";
import type { ScenarioComparison } from "./ScenarioComparison";
import type { ScenarioRunSpec } from "./ScenarioRunner";
import { getScenarioTemplate } from "./ScenarioTemplates";
import type { ScenarioBaseline, ScenarioInputs, ScenarioKind } from "./ScenarioTypes";
import { recordScenarioObservation } from "./observability";

export type ScenarioServiceRequest = {
  readonly baseline: ScenarioBaseline;
  readonly specs: readonly ScenarioRunSpec[];
  readonly compare?: boolean;
  readonly observe?: boolean;
  readonly mode?: "single" | "compare" | "decision_what_if";
};

export type ScenarioServiceResponse = {
  readonly results: readonly ScenarioResult[];
  readonly comparison: ScenarioComparison | null;
  readonly observationId: string;
  readonly durationMs: number;
};

let seq = 0;

function summarizeInputs(specs: readonly ScenarioRunSpec[]): Record<string, string> {
  const first = specs[0]?.inputs;
  if (!first) return {};
  return {
    organizationId: first.organizationId,
    kinds: specs.map((s) => s.kind).join(","),
    enrollmentPercent: String(first.enrollmentPercent ?? ""),
    headcount: String(first.headcount ?? first.staffCount ?? ""),
    fundingDollars: String(first.fundingDollars ?? ""),
    timelineDays: String(first.timelineDays ?? ""),
    specCount: String(specs.length),
  };
}

export const ScenarioService = {
  registry: ScenarioRegistry,

  run(request: ScenarioServiceRequest): ScenarioServiceResponse {
    const startedAt = new Date().toISOString();
    const run = runScenarioEngine({
      baseline: request.baseline,
      specs: request.specs,
      compare: request.compare,
    });
    const finishedAt = new Date().toISOString();
    const observationId = `sobs-${++seq}-${Date.now()}`;
    const mode = request.mode ?? (request.compare ? "compare" : "single");

    if (request.observe !== false) {
      recordScenarioObservation({
        id: observationId,
        organizationId: request.baseline.organizationId,
        kinds: request.specs.map((s) => s.kind),
        startedAt,
        finishedAt,
        durationMs: run.durationMs,
        inputSummary: summarizeInputs(request.specs),
        confidenceByScenario: run.confidenceByScenario,
        comparisonId: run.comparison?.id ?? null,
        scenarioIds: run.results.map((r) => r.id),
        mode,
      });
    }

    return {
      results: run.results,
      comparison: run.comparison,
      observationId: request.observe === false ? "" : observationId,
      durationMs: run.durationMs,
    };
  },

  runTemplate(options: {
    readonly baseline: ScenarioBaseline;
    readonly kind: ScenarioKind;
    readonly overrides?: Partial<ScenarioInputs>;
    readonly observe?: boolean;
  }): ScenarioServiceResponse {
    const template = getScenarioTemplate(options.kind);
    const inputs: ScenarioInputs = {
      ...template.defaultInputs,
      ...options.overrides,
      organizationId: options.baseline.organizationId,
      organizationName: options.baseline.organizationName,
    };
    return this.run({
      baseline: options.baseline,
      specs: [{ kind: options.kind, inputs }],
      compare: false,
      observe: options.observe,
      mode: "single",
    });
  },

  compare(options: {
    readonly baseline: ScenarioBaseline;
    readonly specs: readonly ScenarioRunSpec[];
    readonly observe?: boolean;
  }): ScenarioServiceResponse {
    return this.run({
      baseline: options.baseline,
      specs: options.specs,
      compare: true,
      observe: options.observe,
      mode: "compare",
    });
  },

  /**
   * Decision Center what-if branches — approve / defer / reject.
   */
  decisionWhatIf(options: {
    readonly baseline: ScenarioBaseline;
    readonly decisionId: string;
    readonly decisionTitle: string;
    readonly branch: DecisionWhatIfBranch;
    readonly category?: string;
    readonly observe?: boolean;
  }): DecisionWhatIfResult {
    const kind = kindForDecisionCategory(options.category);
    const template = getScenarioTemplate(kind);
    const magnitude =
      options.branch === "approve" ? 1 : options.branch === "defer" ? 0.35 : -0.6;
    const overrides = scaleTemplateInputs(template.defaultInputs, magnitude);
    const { results } = this.run({
      baseline: options.baseline,
      specs: [
        {
          kind,
          inputs: {
            ...template.defaultInputs,
            ...overrides,
            customLabel:
              options.branch === "approve"
                ? `Approve: ${options.decisionTitle}`
                : options.branch === "defer"
                  ? `Defer: ${options.decisionTitle}`
                  : `Reject: ${options.decisionTitle}`,
            notes: `Decision what-if (${options.branch})`,
            organizationId: options.baseline.organizationId,
            organizationName: options.baseline.organizationName,
          },
        },
      ],
      compare: false,
      observe: options.observe,
      mode: "decision_what_if",
    });
    const scenario = results[0]!;
    const verb =
      options.branch === "approve"
        ? "approve"
        : options.branch === "defer"
          ? "defer"
          : "reject";
    const statement = `If we ${verb} “${options.decisionTitle}”, the advisory projection is a ${
      scenario.projectedDifference.scoreDelta >= 0 ? "net uplift" : "net decline"
    } of ${Math.abs(scenario.projectedDifference.scoreDelta * 100).toFixed(1)} points (${scenario.scenarioState.stance.replace("_", " ")} stance, ${(scenario.confidence * 100).toFixed(0)}% confidence).`;

    return {
      decisionId: options.decisionId,
      decisionTitle: options.decisionTitle,
      branch: options.branch,
      statement,
      scenario,
      advisoryNotice: scenario.advisoryNotice,
    };
  },
} as const;

function kindForDecisionCategory(category?: string): ScenarioKind {
  switch (category) {
    case "funding":
      return "funding_increase";
    case "students":
      return "enrollment_growth";
    case "operations":
      return "teacher_hiring";
    case "executive":
      return "budget_reallocation";
    default:
      return "custom";
  }
}

function scaleTemplateInputs(
  defaults: Partial<ScenarioInputs>,
  magnitude: number
): Partial<ScenarioInputs> {
  return {
    enrollmentPercent:
      defaults.enrollmentPercent != null
        ? Number((defaults.enrollmentPercent * magnitude).toFixed(2))
        : undefined,
    headcount:
      defaults.headcount != null
        ? Math.round(defaults.headcount * magnitude)
        : undefined,
    staffCount:
      defaults.staffCount != null
        ? Math.round(defaults.staffCount * magnitude)
        : undefined,
    fundingDollars:
      defaults.fundingDollars != null
        ? Math.round(defaults.fundingDollars * magnitude)
        : undefined,
    capacity:
      defaults.capacity != null
        ? Number((defaults.capacity * magnitude).toFixed(3))
        : undefined,
    timelineDays: defaults.timelineDays,
  };
}
