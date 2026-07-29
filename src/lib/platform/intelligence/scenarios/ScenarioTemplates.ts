/**
 * Built-in scenario templates — Sprint 202.
 */

import type { ScenarioInputs, ScenarioKind } from "./ScenarioTypes";
import { SCENARIO_KIND_LABELS } from "./ScenarioTypes";

export type ScenarioTemplate = {
  readonly kind: ScenarioKind;
  readonly title: string;
  readonly description: string;
  readonly defaultInputs: Partial<ScenarioInputs>;
  readonly inputHints: readonly string[];
};

export const SCENARIO_TEMPLATES: readonly ScenarioTemplate[] = [
  {
    kind: "enrollment_growth",
    title: SCENARIO_KIND_LABELS.enrollment_growth,
    description: "Model an increase in enrollment and downstream capacity pressure.",
    defaultInputs: { enrollmentPercent: 10, timelineDays: 90 },
    inputHints: ["enrollmentPercent", "capacity", "timelineDays"],
  },
  {
    kind: "enrollment_decline",
    title: SCENARIO_KIND_LABELS.enrollment_decline,
    description: "Model a decline in enrollment and funding/staffing implications.",
    defaultInputs: { enrollmentPercent: -10, timelineDays: 90 },
    inputHints: ["enrollmentPercent", "fundingDollars", "timelineDays"],
  },
  {
    kind: "teacher_hiring",
    title: SCENARIO_KIND_LABELS.teacher_hiring,
    description: "Model hiring additional teachers / instructional staff.",
    defaultInputs: { headcount: 5, staffCount: 5, timelineDays: 60 },
    inputHints: ["headcount", "staffCount", "fundingDollars", "timelineDays"],
  },
  {
    kind: "teacher_loss",
    title: SCENARIO_KIND_LABELS.teacher_loss,
    description: "Model teacher attrition or unfilled positions.",
    defaultInputs: { headcount: -3, staffCount: -3, timelineDays: 45 },
    inputHints: ["headcount", "staffCount", "timelineDays"],
  },
  {
    kind: "funding_increase",
    title: SCENARIO_KIND_LABELS.funding_increase,
    description: "Model incremental funding and readiness uplift.",
    defaultInputs: { fundingDollars: 250_000, timelineDays: 120 },
    inputHints: ["fundingDollars", "timelineDays"],
  },
  {
    kind: "funding_reduction",
    title: SCENARIO_KIND_LABELS.funding_reduction,
    description: "Model a funding cut and constrained operations.",
    defaultInputs: { fundingDollars: -250_000, timelineDays: 90 },
    inputHints: ["fundingDollars", "timelineDays", "staffCount"],
  },
  {
    kind: "budget_reallocation",
    title: SCENARIO_KIND_LABELS.budget_reallocation,
    description: "Model shifting budget between programs without net funding change.",
    defaultInputs: { fundingDollars: 0, capacity: 0.05, timelineDays: 60 },
    inputHints: ["fundingDollars", "capacity", "timelineDays", "notes"],
  },
  {
    kind: "open_new_campus",
    title: SCENARIO_KIND_LABELS.open_new_campus,
    description: "Model opening a new campus — capacity, staffing, and funding load.",
    defaultInputs: {
      enrollmentPercent: 15,
      headcount: 12,
      fundingDollars: 500_000,
      timelineDays: 180,
    },
    inputHints: ["enrollmentPercent", "headcount", "fundingDollars", "capacity", "timelineDays"],
  },
  {
    kind: "close_program",
    title: SCENARIO_KIND_LABELS.close_program,
    description: "Model closing a program — capacity relief vs student/community impact.",
    defaultInputs: {
      enrollmentPercent: -8,
      staffCount: -4,
      fundingDollars: -100_000,
      timelineDays: 120,
    },
    inputHints: ["enrollmentPercent", "staffCount", "fundingDollars", "timelineDays"],
  },
  {
    kind: "compliance_change",
    title: SCENARIO_KIND_LABELS.compliance_change,
    description: "Model a material compliance policy change.",
    defaultInputs: { capacity: -0.05, staffCount: 2, timelineDays: 90 },
    inputHints: ["staffCount", "capacity", "timelineDays", "notes"],
  },
  {
    kind: "custom",
    title: SCENARIO_KIND_LABELS.custom,
    description: "Free-form executive scenario with structured extensible inputs.",
    defaultInputs: { timelineDays: 90, customLabel: "Custom change" },
    inputHints: [
      "customLabel",
      "enrollmentPercent",
      "headcount",
      "fundingDollars",
      "capacity",
      "timelineDays",
      "notes",
    ],
  },
];

export function getScenarioTemplate(kind: ScenarioKind): ScenarioTemplate {
  return SCENARIO_TEMPLATES.find((t) => t.kind === kind) ?? SCENARIO_TEMPLATES[SCENARIO_TEMPLATES.length - 1]!;
}
