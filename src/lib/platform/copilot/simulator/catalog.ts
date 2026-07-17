/**
 * Decision simulator catalog — "what happens if..." scenarios.
 * Reuses predictive + wisdom via injected results (no intelligence package edits).
 */

import type { DecisionScenarioKind } from "../types";
import type { ForecastDomain, ForecastScenarioDefinition } from "@/lib/platform/intelligence/predictive-intelligence/types";

export type ScenarioCatalogEntry = {
  kind: DecisionScenarioKind;
  title: string;
  match: RegExp[];
  description: string;
  build: (pct?: number) => ForecastScenarioDefinition;
};

function scenario(
  id: string,
  title: string,
  description: string,
  multipliers: Partial<Record<ForecastDomain, number>>,
  offsets?: Partial<Record<ForecastDomain, number>>
): ForecastScenarioDefinition {
  return {
    id,
    title,
    kind: "decision_linked",
    description,
    domainMultipliers: multipliers,
    domainOffsets: offsets,
  };
}

export const SCENARIO_CATALOG: ScenarioCatalogEntry[] = [
  {
    kind: "raise_tuition",
    title: "Raise tuition 5%",
    match: [/raise tuition/i, /tuition\s*\+?\s*5/i, /increase tuition/i],
    description: "Model a 5% tuition increase and near-term revenue / enrollment effects.",
    build: (pct = 5) =>
      scenario(
        `sim-tuition-${pct}`,
        `Raise tuition ${pct}%`,
        `What happens if we raise tuition ${pct}%?`,
        { revenue: 1 + pct / 100, enrollment: 1 - pct / 200, cash_flow: 1 + pct / 150, admissions: 0.98 },
        { risk: 2 }
      ),
  },
  {
    kind: "delay_hiring",
    title: "Delay hiring",
    match: [/delay hiring/i, /freeze hiring/i, /pause hiring/i],
    description: "Defer open roles; model payroll relief vs capacity / staffing risk.",
    build: () =>
      scenario(
        "sim-delay-hiring",
        "Delay hiring",
        "What happens if we delay hiring?",
        { payroll: 0.92, staffing: 0.88, capacity: 0.9, expense: 0.96, risk: 1.08 },
        { risk: 3 }
      ),
  },
  {
    kind: "add_campus",
    title: "Add a new campus",
    match: [/add (a )?new campus/i, /new campus/i, /expand campus/i],
    description: "Open a campus: enrollment upside with expense / cash / capacity pressure.",
    build: () =>
      scenario(
        "sim-add-campus",
        "Add a new campus",
        "What happens if we add a new campus?",
        {
          enrollment: 1.18,
          revenue: 1.12,
          expense: 1.22,
          cash_flow: 0.9,
          staffing: 1.15,
          capacity: 1.2,
          risk: 1.12,
        },
        { expense: 8, risk: 5 }
      ),
  },
  {
    kind: "reduce_expenses",
    title: "Reduce expenses",
    match: [/reduce expenses/i, /cut (costs|expenses)/i, /expense reduction/i],
    description: "Across-the-board expense reduction with mission / capacity trade-offs.",
    build: (pct = 8) =>
      scenario(
        `sim-cut-expenses-${pct}`,
        `Reduce expenses ${pct}%`,
        `What happens if we reduce expenses ${pct}%?`,
        {
          expense: 1 - pct / 100,
          cash_flow: 1 + pct / 120,
          capacity: 1 - pct / 250,
          staffing: 1 - pct / 300,
          mission: 0.97,
        }
      ),
  },
  {
    kind: "increase_salaries",
    title: "Increase salaries",
    match: [/increase salaries/i, /raise salaries/i, /pay raise/i, /compensation increase/i],
    description: "Compensation uplift: retention / staffing quality vs payroll and cash.",
    build: (pct = 5) =>
      scenario(
        `sim-salaries-${pct}`,
        `Increase salaries ${pct}%`,
        `What happens if we increase salaries ${pct}%?`,
        {
          payroll: 1 + pct / 100,
          expense: 1 + pct / 150,
          staffing: 1.06,
          cash_flow: 1 - pct / 200,
          mission: 1.02,
        },
        { risk: 1 }
      ),
  },
];

export function matchScenarioKind(question: string): DecisionScenarioKind {
  for (const entry of SCENARIO_CATALOG) {
    if (entry.match.some((re) => re.test(question))) return entry.kind;
  }
  return "custom";
}

export function resolveScenarioDefinition(
  question: string,
  kind?: DecisionScenarioKind
): { kind: DecisionScenarioKind; definition: ForecastScenarioDefinition; title: string } {
  const resolved = kind && kind !== "custom" ? kind : matchScenarioKind(question);
  const entry = SCENARIO_CATALOG.find((e) => e.kind === resolved);
  if (entry) {
    return { kind: entry.kind, definition: entry.build(), title: entry.title };
  }
  return {
    kind: "custom",
    title: "Custom scenario",
    definition: scenario(
      "sim-custom",
      "Custom executive scenario",
      question || "What happens if leadership changes course?",
      { executive_kpi: 1.02, risk: 1.05, cash_flow: 0.98 },
      { risk: 2 }
    ),
  };
}
