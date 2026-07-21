/**
 * Outcome measurement + lessons for Executive Memory persistence.
 */

import type {
  Initiative,
  InitiativeOutcomeMeasurement,
} from "@/lib/platform/intelligence/initiative-intelligence/types";

export class OutcomeEngine {
  constructor(private readonly now: () => Date = () => new Date()) {}

  measure(initiative: Initiative): InitiativeOutcomeMeasurement {
    const kpiResults = initiative.kpis.map((kpi) => {
      const actual = kpi.actual ?? 0;
      return {
        kpiId: kpi.id,
        name: kpi.name,
        target: kpi.target,
        actual,
        met: actual >= kpi.target,
      };
    });

    const completedAt = this.now().toISOString();
    let varianceDays = 0;
    if (initiative.targetCompletionDate) {
      const target = new Date(initiative.targetCompletionDate).getTime();
      varianceDays = Math.round(
        (new Date(completedAt).getTime() - target) / (1000 * 60 * 60 * 24)
      );
    }

    const lessons = [
      `Initiative "${initiative.title}" completed in state ${initiative.state}.`,
      kpiResults.every((k) => k.met)
        ? "All KPIs met — replicate playbook for similar initiatives."
        : "Some KPIs missed — refine targets and leading indicators.",
      initiative.budget.actual > initiative.budget.planned
        ? "Budget overrun — tighten forecasting assumptions."
        : "Budget within plan — retain staffing model.",
    ];

    const futureRecommendations = [
      "Link next decision cycle to this outcome before proposing similar work.",
      "Keep role-based owners stable across the execution horizon.",
    ];

    return {
      actualOutcomes: initiative.expectedOutcomes.map(
        (o) => o.description || o.title
      ),
      kpiResults,
      budgetPerformance: {
        planned: initiative.budget.planned,
        actual: initiative.budget.actual,
        variance: initiative.budget.actual - initiative.budget.planned,
      },
      timelinePerformance: {
        targetDate: initiative.targetCompletionDate,
        completedAt,
        varianceDays,
      },
      lessonsLearned: lessons,
      futureRecommendations,
      persistedToMemory: true,
    };
  }
}
