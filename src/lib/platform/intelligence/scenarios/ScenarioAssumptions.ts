/**
 * Assumption framework for scenario projections — Sprint 202.
 */

export type ScenarioAssumption = {
  readonly id: string;
  readonly statement: string;
  readonly category: "continuity" | "magnitude" | "timing" | "external" | "advisory";
  readonly impactIfWrong: string;
};

export function buildScenarioAssumptions(input: {
  readonly kindLabel: string;
  readonly timelineDays: number;
  readonly hasBaselineSignals: boolean;
}): readonly ScenarioAssumption[] {
  return [
    {
      id: "a-advisory",
      statement:
        "This scenario projection is advisory and must not be treated as a guaranteed outcome.",
      category: "advisory",
      impactIfWrong: "Treating it as certainty may cause over- or under-reaction.",
    },
    {
      id: "a-continuity",
      statement: `Other organizational conditions remain similar while modeling ${input.kindLabel}.`,
      category: "continuity",
      impactIfWrong: "Concurrent shocks would dominate the projected path.",
    },
    {
      id: "a-timing",
      statement: `Effects are modeled over approximately ${input.timelineDays} days.`,
      category: "timing",
      impactIfWrong: "Faster or slower realization changes near-term risk and opportunity.",
    },
    {
      id: "a-magnitude",
      statement: "Input magnitudes are applied linearly with bounded saturation — not a full simulation.",
      category: "magnitude",
      impactIfWrong: "Non-linear real-world responses may exceed or understate impacts.",
    },
    {
      id: "a-external",
      statement: "External policy, market, and community shocks are not explicitly modeled.",
      category: "external",
      impactIfWrong: "Unmodeled external events can invalidate the comparison.",
    },
    ...(input.hasBaselineSignals
      ? []
      : [
          {
            id: "a-thin-baseline",
            statement:
              "Baseline contributor signals are thin or missing; confidence is reduced accordingly.",
            category: "continuity" as const,
            impactIfWrong: "Richer bound intelligence would change projected differences.",
          },
        ]),
  ];
}
