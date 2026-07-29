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
      contributorId: EDUCATION_CONTRIBUTOR_IDS.progressCognition,
      nodeKind: "progress",
      capabilities: ["education", "progress"],
      dependsOn: [],
      expectedOutputs: [
        "evidence.progress",
        "recommendations.progress",
        "proposals.progress",
      ],
      intentMatchers: ["progress", "assess"],
      available: true,
      label: "Academic Progress Intelligence",
    },
    {
      contributorId: EDUCATION_CONTRIBUTOR_IDS.studentSuccessCognition,
      nodeKind: "student_success",
      capabilities: ["education", "student_success", "synthesis"],
      dependsOn: [
        EDUCATION_CONTRIBUTOR_IDS.enrollmentCognition,
        EDUCATION_CONTRIBUTOR_IDS.attendanceCognition,
        EDUCATION_CONTRIBUTOR_IDS.progressCognition,
      ],
      expectedOutputs: [
        "evidence.student_success",
        "recommendations.student_success",
        "proposals.student_success",
      ],
      intentMatchers: [
        "student_success",
        "quarterly",
        "advisor",
        "leadership",
        "brief",
      ],
      available: true,
      label: "Student Success Intelligence (synthesis)",
    },
    {
      contributorId: EDUCATION_CONTRIBUTOR_IDS.interventionCognition,
      nodeKind: "intervention",
      capabilities: ["education", "intervention", "support"],
      dependsOn: [
        EDUCATION_CONTRIBUTOR_IDS.studentSuccessCognition,
        EDUCATION_CONTRIBUTOR_IDS.attendanceCognition,
        EDUCATION_CONTRIBUTOR_IDS.progressCognition,
      ],
      expectedOutputs: [
        "evidence.intervention",
        "recommendations.intervention",
        "proposals.intervention",
      ],
      intentMatchers: [
        "intervention",
        "support",
        "mtss",
        "student_services",
        "student services",
      ],
      available: true,
      label: "Intervention Intelligence",
    },
    {
      contributorId: EDUCATION_CONTRIBUTOR_IDS.familyEngagementCognition,
      nodeKind: "family_engagement",
      capabilities: ["education", "family", "family_engagement", "support"],
      dependsOn: [
        EDUCATION_CONTRIBUTOR_IDS.studentSuccessCognition,
        EDUCATION_CONTRIBUTOR_IDS.attendanceCognition,
        EDUCATION_CONTRIBUTOR_IDS.enrollmentCognition,
      ],
      expectedOutputs: [
        "evidence.family_engagement",
        "recommendations.family_engagement",
        "proposals.family_engagement",
      ],
      intentMatchers: [
        "family",
        "communicate",
        "family meeting",
        "support",
        "mtss",
      ],
      available: true,
      label: "Family Engagement Intelligence",
    },
    {
      contributorId: EDUCATION_CONTRIBUTOR_IDS.supportPlanningCognition,
      nodeKind: "support_planning",
      capabilities: ["education", "support", "support_planning", "synthesis"],
      dependsOn: [
        EDUCATION_CONTRIBUTOR_IDS.interventionCognition,
        EDUCATION_CONTRIBUTOR_IDS.familyEngagementCognition,
        EDUCATION_CONTRIBUTOR_IDS.studentSuccessCognition,
      ],
      expectedOutputs: [
        "evidence.support_planning",
        "recommendations.support_planning",
        "proposals.support_planning",
      ],
      intentMatchers: [
        "support",
        "mtss",
        "student_services",
        "student services",
        "support review",
        "support_review",
      ],
      available: true,
      label: "Support Planning (synthesis)",
    },
    {
      contributorId: EDUCATION_CONTRIBUTOR_IDS.schedulingCognition,
      nodeKind: "scheduling",
      capabilities: ["education", "scheduling", "operations"],
      dependsOn: [],
      expectedOutputs: [
        "evidence.scheduling",
        "recommendations.scheduling",
        "proposals.scheduling",
      ],
      intentMatchers: [
        "schedule",
        "scheduling",
        "operations",
        "semester",
        "daily",
      ],
      available: true,
      label: "Scheduling Intelligence",
    },
    {
      contributorId: EDUCATION_CONTRIBUTOR_IDS.staffingCognition,
      nodeKind: "staffing",
      capabilities: ["education", "staffing", "operations"],
      dependsOn: [],
      expectedOutputs: [
        "evidence.staffing",
        "recommendations.staffing",
        "proposals.staffing",
      ],
      intentMatchers: ["staffing", "staff", "operations", "semester"],
      available: true,
      label: "Staffing Intelligence",
    },
    {
      contributorId: EDUCATION_CONTRIBUTOR_IDS.capacityCognition,
      nodeKind: "capacity",
      capabilities: ["education", "capacity", "operations"],
      dependsOn: [],
      expectedOutputs: [
        "evidence.capacity",
        "recommendations.capacity",
        "proposals.capacity",
      ],
      intentMatchers: ["capacity", "operations", "semester"],
      available: true,
      label: "Capacity Intelligence",
    },
    {
      contributorId: EDUCATION_CONTRIBUTOR_IDS.operationalReadinessCognition,
      nodeKind: "operational_readiness",
      capabilities: [
        "education",
        "operations",
        "operational_readiness",
        "synthesis",
      ],
      dependsOn: [
        EDUCATION_CONTRIBUTOR_IDS.schedulingCognition,
        EDUCATION_CONTRIBUTOR_IDS.staffingCognition,
        EDUCATION_CONTRIBUTOR_IDS.capacityCognition,
      ],
      expectedOutputs: [
        "evidence.operational_readiness",
        "recommendations.operational_readiness",
        "proposals.operational_readiness",
      ],
      intentMatchers: [
        "operations",
        "operational",
        "daily operations",
        "semester",
        "leadership operations",
      ],
      available: true,
      label: "Operational Readiness (synthesis)",
    },
    {
      contributorId: EDUCATION_CONTRIBUTOR_IDS.scholarshipCognition,
      nodeKind: "scholarship",
      capabilities: ["education", "scholarship", "funding"],
      dependsOn: [EDUCATION_CONTRIBUTOR_IDS.enrollmentCognition],
      expectedOutputs: [
        "evidence.scholarship",
        "recommendations.scholarship",
        "proposals.scholarship",
      ],
      intentMatchers: [
        "scholarship",
        "funding",
        "eligibility",
        "annual eligibility",
      ],
      available: true,
      label: "Scholarship Intelligence",
    },
    {
      contributorId: EDUCATION_CONTRIBUTOR_IDS.complianceCognition,
      nodeKind: "compliance",
      capabilities: ["education", "compliance", "funding"],
      dependsOn: [],
      expectedOutputs: [
        "evidence.compliance",
        "recommendations.compliance",
        "proposals.compliance",
      ],
      intentMatchers: [
        "compliance",
        "funding",
        "audit",
        "eligibility",
      ],
      available: true,
      label: "Compliance Intelligence",
    },
    {
      contributorId: EDUCATION_CONTRIBUTOR_IDS.fundingReadinessCognition,
      nodeKind: "funding_readiness",
      capabilities: ["education", "funding", "funding_readiness", "synthesis"],
      dependsOn: [
        EDUCATION_CONTRIBUTOR_IDS.scholarshipCognition,
        EDUCATION_CONTRIBUTOR_IDS.complianceCognition,
        EDUCATION_CONTRIBUTOR_IDS.enrollmentCognition,
      ],
      expectedOutputs: [
        "evidence.funding_readiness",
        "recommendations.funding_readiness",
        "proposals.funding_readiness",
      ],
      intentMatchers: [
        "funding",
        "scholarship",
        "compliance",
        "eligibility",
        "audit",
        "executive funding",
      ],
      available: true,
      label: "Funding Readiness (synthesis)",
    },
  ];
}

/**
 * Preserve declared catalog dependencies. Historically Intervention used
 * Attendance-OR-Progress; D4.2 declares explicit Student Support deps.
 */
export function normalizeCatalogDependencies(
  catalog: readonly EducationContributorDescriptor[]
): EducationContributorDescriptor[] {
  return catalog.map((d) => ({ ...d, dependsOn: [...d.dependsOn] }));
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
  if (
    contributorId.includes("operational_readiness") ||
    contributorId.includes("operational-readiness")
  ) {
    return "operational_readiness";
  }
  if (
    contributorId.includes("support_planning") ||
    contributorId.includes("support-planning")
  ) {
    return "support_planning";
  }
  if (
    contributorId.includes("student_success") ||
    contributorId.includes("student-success")
  ) {
    return "student_success";
  }
  if (contributorId.includes("progress")) return "progress";
  if (contributorId.includes("staffing")) return "staffing";
  if (contributorId.includes("capacity")) return "capacity";
  if (contributorId.includes("intervention")) return "intervention";
  if (
    contributorId.includes("funding_readiness") ||
    contributorId.includes("funding-readiness")
  ) {
    return "funding_readiness";
  }
  if (contributorId.includes("scholarship")) return "scholarship";
  if (contributorId.includes("scheduling")) return "scheduling";
  if (contributorId.includes("family")) return "family_engagement";
  if (contributorId.includes("compliance")) return "compliance";
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
