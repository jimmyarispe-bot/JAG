/**
 * Select contributors relevant to intent + context — no reasoning engines.
 */

import type { RuntimeIntent } from "@/lib/jag/runtime";
import type { EducationContributorDescriptor } from "./EducationDependencyGraph";
import type { EducationSelectionDecision } from "./EducationPlanResult";

/** Normalized planner context (not a DB record). */
export interface EducationPlannerContext {
  organizationId?: string;
  contextId?: string;
  contextFamily?: string;
  /** Free-form focus tags from host (e.g. attendance, scholarship). */
  focusTags?: readonly string[];
  focusHints?: readonly string[];
  domainHints?: readonly string[];
  attributes?: Readonly<Record<string, unknown>>;
}

export type EducationPlanScenario =
  | "enroll_student"
  | "attendance_review"
  | "student_success_review"
  | "scholarship_review"
  | "support"
  | "generic_education"
  | "unknown";

export interface EducationSelectionResult {
  scenario: EducationPlanScenario;
  selectedIds: string[];
  decisions: EducationSelectionDecision[];
}

/**
 * Map intent / context to a planning scenario.
 */
export function detectEducationPlanScenario(
  intent: RuntimeIntent,
  context: EducationPlannerContext = {}
): EducationPlanScenario {
  const haystack = buildHaystack(intent, context);

  if (
    haystack.includes("scholarship") ||
    intent.intentId.includes("scholarship")
  ) {
    return "scholarship_review";
  }
  if (
    haystack.includes("student_success") ||
    haystack.includes("student success") ||
    (haystack.includes("success") && haystack.includes("review"))
  ) {
    return "student_success_review";
  }
  if (
    haystack.includes("attendance") ||
    intent.intentId.includes("attendance")
  ) {
    return "attendance_review";
  }
  if (
    intent.intentId === "education.support" ||
    intent.intentId.endsWith(".support") ||
    (haystack.includes("support") && !haystack.includes("success"))
  ) {
    return "support";
  }
  if (
    intent.intentId === "education.enroll" ||
    intent.intentId.endsWith(".enroll") ||
    haystack.includes("enroll student") ||
    (haystack.includes("enroll") && !haystack.includes("scholarship"))
  ) {
    return "enroll_student";
  }
  if (
    intent.domainHints.includes("education") ||
    intent.intentId.startsWith("education.")
  ) {
    return "generic_education";
  }
  return "unknown";
}

/** Scenario → contributor ids that can affect the intent. */
export const EDUCATION_SCENARIO_CONTRIBUTORS: Record<
  EducationPlanScenario,
  readonly string[]
> = {
  enroll_student: ["education.cognition.enrollment"],
  attendance_review: ["education.cognition.attendance"],
  student_success_review: [
    "education.cognition.enrollment",
    "education.cognition.attendance",
    "education.cognition.progress",
    "education.cognition.intervention",
  ],
  scholarship_review: [
    "education.cognition.enrollment",
    "education.cognition.scholarship",
  ],
  support: [
    "education.cognition.attendance",
    "education.cognition.intervention",
  ],
  generic_education: [
    "education.cognition.enrollment",
    "education.cognition.attendance",
  ],
  unknown: [],
};

export function selectEducationContributors(input: {
  intent: RuntimeIntent;
  context?: EducationPlannerContext;
  catalog: readonly EducationContributorDescriptor[];
}): EducationSelectionResult {
  const catalog = input.catalog;
  const byId = new Map(catalog.map((d) => [d.contributorId, d] as const));
  const scenario = detectEducationPlanScenario(
    input.intent,
    input.context ?? {}
  );
  const haystack = buildHaystack(input.intent, input.context ?? {});

  const desired = new Set<string>(EDUCATION_SCENARIO_CONTRIBUTORS[scenario]);

  // Soft intentMatchers only when scenario is not already specific
  if (scenario === "generic_education" || scenario === "unknown") {
    for (const d of catalog) {
      if (
        d.intentMatchers.some((m) => haystack.includes(m.toLowerCase()))
      ) {
        desired.add(d.contributorId);
      }
    }
  }

  // Host focus tags / hints can add related contributors
  for (const tag of [
    ...(input.context?.focusTags ?? []),
    ...(input.context?.focusHints ?? []),
  ]) {
    const t = tag.toLowerCase();
    for (const d of catalog) {
      if (
        d.nodeKind === t ||
        d.capabilities.some((c) => c.toLowerCase() === t) ||
        d.intentMatchers.some((m) => m.toLowerCase() === t)
      ) {
        desired.add(d.contributorId);
      }
    }
  }

  expandDependencies(desired, byId);

  const selectedIds: string[] = [];
  const decisions: EducationSelectionDecision[] = [];

  for (const d of catalog) {
    if (!desired.has(d.contributorId)) {
      decisions.push({
        contributorId: d.contributorId,
        decision: "skip",
        reason: `Not relevant to scenario "${scenario}" — cannot affect requested intent`,
      });
      continue;
    }

    if (!d.available) {
      decisions.push({
        contributorId: d.contributorId,
        decision: "skip",
        reason: "Selected by intent but contributor is unavailable",
      });
      continue;
    }

    selectedIds.push(d.contributorId);
    decisions.push({
      contributorId: d.contributorId,
      decision: "include",
      reason: reasonForInclude(d.contributorId, scenario),
    });
  }

  return { scenario, selectedIds, decisions };
}

function expandDependencies(
  desired: Set<string>,
  byId: Map<string, EducationContributorDescriptor>
): void {
  let changed = true;
  while (changed) {
    changed = false;
    for (const id of [...desired]) {
      const desc = byId.get(id);
      if (!desc) continue;
      for (const dep of desc.dependsOn) {
        if (!desired.has(dep)) {
          desired.add(dep);
          changed = true;
        }
      }
    }
  }
}

function reasonForInclude(
  contributorId: string,
  scenario: EducationPlanScenario
): string {
  if (scenario === "enroll_student" && contributorId.includes("enrollment")) {
    return "Included for enroll student intent";
  }
  if (
    scenario === "attendance_review" &&
    contributorId.includes("attendance")
  ) {
    return "Included for attendance review intent";
  }
  if (scenario === "scholarship_review") {
    return "Included for scholarship review intent";
  }
  if (scenario === "student_success_review") {
    return "Included for student success review intent";
  }
  if (scenario === "support") {
    return "Included for support intent";
  }
  return `Included for scenario "${scenario}"`;
}

function buildHaystack(
  intent: RuntimeIntent,
  context: EducationPlannerContext
): string {
  return [
    intent.intentId,
    intent.label ?? "",
    ...intent.domainHints,
    ...intent.actionCandidates,
    ...(context.focusTags ?? []),
    ...(context.focusHints ?? []),
    ...(context.domainHints ?? []),
    typeof context.attributes?.scenario === "string"
      ? context.attributes.scenario
      : "",
  ]
    .join(" ")
    .toLowerCase();
}
