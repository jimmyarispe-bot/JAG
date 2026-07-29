/**
 * Education Intelligence Planner — builds execution plans only.
 * Does not run contributors or graph aggregation.
 */

import type { RuntimeIntent } from "@/lib/jag/runtime";
import { EDUCATION_CONTRIBUTOR_IDS } from "../../types";
import type { EducationGraphNodeKind } from "../graph";
import {
  buildDependencyEdges,
  orderContributorsByDependencies,
  type EducationContributorDescriptor,
} from "./EducationDependencyGraph";
import type { EducationExecutionNode } from "./EducationExecutionNode";
import type { EducationExecutionPlan } from "./EducationExecutionPlan";
import {
  selectEducationContributors,
  type EducationPlannerContext,
} from "./EducationContributorSelector";
import { validateEducationExecutionPlan } from "./EducationPlanValidator";
import type {
  EducationPlanResult,
  EducationPlanValidationIssue,
} from "./EducationPlanResult";

export interface EducationPlannerInput {
  intent: RuntimeIntent;
  context?: EducationPlannerContext;
  /** Override / extend default catalog. */
  catalog?: readonly EducationContributorDescriptor[];
  now?: string;
}

export interface EducationPlanner {
  plan(input: EducationPlannerInput): EducationPlanResult;
  catalog(): readonly EducationContributorDescriptor[];
}

/** Default Education contributor catalog (extensible). */
export function createDefaultEducationContributorCatalog(): EducationContributorDescriptor[] {
  return [
    {
      contributorId: EDUCATION_CONTRIBUTOR_IDS.enrollmentCognition,
      nodeKind: "enrollment",
      capabilities: ["education", "enrollment"],
      dependsOn: [],
      expectedOutputs: [
        "evidence.enrollment",
        "recommendations.enrollment",
        "proposals.enrollment",
      ],
      intentMatchers: ["enroll", "scholarship"],
      available: true,
      label: "Enrollment Intelligence",
    },
    {
      contributorId: EDUCATION_CONTRIBUTOR_IDS.attendanceCognition,
      nodeKind: "attendance",
      capabilities: ["education", "attendance"],
      dependsOn: [],
      expectedOutputs: [
        "evidence.attendance",
        "recommendations.attendance",
        "proposals.attendance",
      ],
      intentMatchers: ["attendance", "support"],
      available: true,
      label: "Attendance Intelligence",
    },
    {
      contributorId: "education.cognition.progress",
      nodeKind: "progress",
      capabilities: ["education", "progress"],
      dependsOn: [],
      expectedOutputs: ["evidence.progress", "recommendations.progress"],
      intentMatchers: ["progress", "assess", "success"],
      available: false,
      label: "Progress Intelligence (future)",
    },
    {
      contributorId: "education.cognition.intervention",
      nodeKind: "intervention",
      capabilities: ["education", "intervention"],
      dependsOn: [EDUCATION_CONTRIBUTOR_IDS.attendanceCognition],
      expectedOutputs: [
        "evidence.intervention",
        "recommendations.intervention",
        "proposals.intervention",
      ],
      intentMatchers: ["intervention", "support", "success"],
      available: false,
      label: "Intervention Intelligence (future)",
    },
    {
      contributorId: "education.cognition.scholarship",
      nodeKind: "scholarship",
      capabilities: ["education", "scholarship"],
      dependsOn: [EDUCATION_CONTRIBUTOR_IDS.enrollmentCognition],
      expectedOutputs: [
        "evidence.scholarship",
        "recommendations.scholarship",
      ],
      intentMatchers: ["scholarship"],
      available: false,
      label: "Scholarship Intelligence (future)",
    },
    {
      contributorId: "education.cognition.scheduling",
      nodeKind: "scheduling",
      capabilities: ["education", "scheduling"],
      dependsOn: [],
      expectedOutputs: ["evidence.scheduling", "recommendations.scheduling"],
      intentMatchers: ["schedule", "plan"],
      available: false,
      label: "Scheduling Intelligence (future)",
    },
    {
      contributorId: "education.cognition.compliance",
      nodeKind: "compliance",
      capabilities: ["education", "compliance"],
      dependsOn: [],
      expectedOutputs: ["evidence.compliance"],
      intentMatchers: ["compliance"],
      available: false,
      label: "Compliance Intelligence (future)",
    },
    {
      contributorId: "education.cognition.family_engagement",
      nodeKind: "family_engagement",
      capabilities: ["education", "family"],
      dependsOn: [],
      expectedOutputs: ["recommendations.family"],
      intentMatchers: ["family", "communicate"],
      available: false,
      label: "Family Engagement Intelligence (future)",
    },
  ];
}

/**
 * Intervention depends on Attendance OR Progress.
 * Prefer the available dependency so missing Progress does not hard-fail
 * when Attendance exists (and vice versa).
 */
export function normalizeCatalogDependencies(
  catalog: readonly EducationContributorDescriptor[]
): EducationContributorDescriptor[] {
  const byId = new Map(catalog.map((d) => [d.contributorId, d] as const));
  return catalog.map((d) => {
    if (d.contributorId !== "education.cognition.intervention") return d;
    const attendance = byId.get(EDUCATION_CONTRIBUTOR_IDS.attendanceCognition);
    const progress = byId.get("education.cognition.progress");
    const deps: string[] = [];
    if (attendance?.available) {
      deps.push(attendance.contributorId);
    } else if (progress?.available) {
      deps.push(progress.contributorId);
    } else {
      deps.push(
        EDUCATION_CONTRIBUTOR_IDS.attendanceCognition,
        "education.cognition.progress"
      );
    }
    return { ...d, dependsOn: deps };
  });
}

export function createEducationPlanner(options?: {
  catalog?: readonly EducationContributorDescriptor[];
}): EducationPlanner {
  const baseCatalog = normalizeCatalogDependencies(
    options?.catalog ?? createDefaultEducationContributorCatalog()
  );

  return {
    catalog() {
      return baseCatalog;
    },
    plan(input) {
      return buildEducationPlan({
        ...input,
        catalog: input.catalog ?? baseCatalog,
      });
    },
  };
}

/** Build an Education execution plan (selection + ordering + validation). */
export function buildEducationPlan(
  input: EducationPlannerInput
): EducationPlanResult {
  const catalog = normalizeCatalogDependencies(
    input.catalog ?? createDefaultEducationContributorCatalog()
  );

  const selection = selectEducationContributors({
    intent: input.intent,
    context: input.context,
    catalog,
  });

  const selectedSet = new Set(selection.selectedIds);
  const dependencyEdges = buildDependencyEdges(catalog).filter(
    (e) => selectedSet.has(e.from) || selectedSet.has(e.to)
  );

  let ordered: string[] = [];
  let stages: Array<{ stage: number; contributorIds: string[] }> = [];
  const validationIssues: EducationPlanValidationIssue[] = [];

  try {
    const orderedResult = orderContributorsByDependencies(
      selection.selectedIds,
      dependencyEdges
    );
    ordered = orderedResult.ordered;
    stages = orderedResult.stages;
  } catch (error) {
    validationIssues.push({
      code: "DEPENDENCY_CYCLE",
      message:
        error instanceof Error ? error.message : "Dependency cycle detected",
      severity: "error",
    });
    ordered = [...selection.selectedIds].sort();
    stages = [{ stage: 0, contributorIds: ordered }];
  }

  const nodes = buildExecutionNodes({
    catalog,
    ordered,
    stages,
    selections: selection.decisions,
  });

  const expectedOutputs = unique(
    nodes
      .filter((n) => n.decision === "include")
      .flatMap((n) => n.expectedOutputs)
  );

  const plan: EducationExecutionPlan = {
    planId: `plan.${input.intent.intentId}.${hash(
      ordered.join("|") + (input.now ?? "")
    )}`,
    intentId: input.intent.intentId,
    orderedContributorIds: ordered,
    nodes,
    stages,
    dependencyEdges,
    skippedContributorIds: selection.decisions
      .filter((d) => d.decision === "skip")
      .map((d) => d.contributorId),
    expectedOutputs,
    createdAt: input.now ?? new Date().toISOString(),
  };

  validationIssues.push(
    ...validateEducationExecutionPlan({
      plan,
      catalog,
      selectedIds: selection.selectedIds,
    })
  );

  const ok = !validationIssues.some((i) => i.severity === "error");

  return {
    ok,
    plan,
    selections: selection.decisions,
    validationIssues,
  };
}

function buildExecutionNodes(input: {
  catalog: readonly EducationContributorDescriptor[];
  ordered: readonly string[];
  stages: Array<{ stage: number; contributorIds: string[] }>;
  selections: EducationPlanResult["selections"];
}): EducationExecutionNode[] {
  const catalogById = new Map(
    input.catalog.map((d) => [d.contributorId, d] as const)
  );
  const decisionById = new Map(
    input.selections.map((s) => [s.contributorId, s] as const)
  );
  const stageById = new Map<string, number>();
  for (const stage of input.stages) {
    for (const id of stage.contributorIds) stageById.set(id, stage.stage);
  }

  const nodes: EducationExecutionNode[] = [];

  input.ordered.forEach((id, order) => {
    const desc = catalogById.get(id);
    const decision = decisionById.get(id);
    nodes.push({
      id: `exec.${id}`,
      contributorId: id,
      nodeKind: (desc?.nodeKind ?? "compliance") as EducationGraphNodeKind,
      stage: stageById.get(id) ?? 0,
      order,
      decision: "include",
      reason: decision?.reason ?? "Included",
      dependsOn: desc?.dependsOn ?? [],
      expectedOutputs: desc?.expectedOutputs ?? [],
      capabilities: desc?.capabilities ?? [],
    });
  });

  for (const selection of input.selections) {
    if (selection.decision !== "skip") continue;
    if (nodes.some((n) => n.contributorId === selection.contributorId)) continue;
    const desc = catalogById.get(selection.contributorId);
    nodes.push({
      id: `exec.${selection.contributorId}`,
      contributorId: selection.contributorId,
      nodeKind: (desc?.nodeKind ??
        inferKind(selection.contributorId)) as EducationGraphNodeKind,
      stage: -1,
      order: -1,
      decision: "skip",
      reason: selection.reason,
      dependsOn: desc?.dependsOn ?? [],
      expectedOutputs: desc?.expectedOutputs ?? [],
      capabilities: desc?.capabilities ?? [],
    });
  }

  return nodes;
}

function inferKind(contributorId: string): EducationGraphNodeKind {
  if (contributorId.includes("enrollment")) return "enrollment";
  if (contributorId.includes("attendance")) return "attendance";
  if (contributorId.includes("progress")) return "progress";
  if (contributorId.includes("intervention")) return "intervention";
  if (contributorId.includes("scholarship")) return "scholarship";
  if (contributorId.includes("scheduling")) return "scheduling";
  if (contributorId.includes("family")) return "family_engagement";
  return "compliance";
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function hash(value: string): string {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

/** Map a successful plan to contributor order for the Intelligence Graph. */
export function planToGraphContributorOrder(
  plan: EducationExecutionPlan
): readonly string[] {
  return plan.orderedContributorIds;
}
