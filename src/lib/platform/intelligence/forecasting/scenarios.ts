import type {
  ScenarioDefinition,
  ScenarioId,
} from "@/lib/platform/intelligence/forecasting/types";

export const SCENARIO_CATALOG: readonly ScenarioDefinition[] = [
  {
    id: "baseline",
    label: "Baseline",
    description: "Continue recent observed rates with no strategic shock.",
    multipliers: {
      admissionsVolume: 1,
      enrollmentGrowth: 1,
      attrition: 1,
      studentsPerTeacher: 1,
      hiringPace: 1,
      tuitionRevenue: 1,
      collectionRate: 1,
      seatCapacity: 1,
    },
  },
  {
    id: "high_growth",
    label: "High Growth",
    description: "Admissions and enrollment expand 12–15% above baseline growth.",
    multipliers: {
      admissionsVolume: 1.15,
      enrollmentGrowth: 1.12,
      attrition: 0.9,
      studentsPerTeacher: 1,
      hiringPace: 1.1,
      tuitionRevenue: 1.12,
      collectionRate: 1.02,
      seatCapacity: 1,
    },
  },
  {
    id: "low_growth",
    label: "Low Growth",
    description: "Demand softens; growth rates reduced by ~10%.",
    multipliers: {
      admissionsVolume: 0.9,
      enrollmentGrowth: 0.95,
      attrition: 1.1,
      studentsPerTeacher: 1,
      hiringPace: 0.9,
      tuitionRevenue: 0.95,
      collectionRate: 0.98,
      seatCapacity: 1,
    },
  },
  {
    id: "reduced_staffing",
    label: "Reduced Staffing",
    description: "Hiring slows; students-per-teacher rises and shortages grow.",
    multipliers: {
      admissionsVolume: 1,
      enrollmentGrowth: 1,
      attrition: 1,
      studentsPerTeacher: 1.15,
      hiringPace: 0.7,
      tuitionRevenue: 1,
      collectionRate: 1,
      seatCapacity: 0.95,
    },
  },
  {
    id: "expanded_capacity",
    label: "Expanded Capacity",
    description: "Seat capacity expands 20%; modest enrollment upside.",
    multipliers: {
      admissionsVolume: 1.05,
      enrollmentGrowth: 1.05,
      attrition: 0.95,
      studentsPerTeacher: 0.95,
      hiringPace: 1.05,
      tuitionRevenue: 1.05,
      collectionRate: 1,
      seatCapacity: 1.2,
    },
  },
] as const;

export function getScenario(id: ScenarioId): ScenarioDefinition {
  const hit = SCENARIO_CATALOG.find((s) => s.id === id);
  if (!hit) return SCENARIO_CATALOG[0]!;
  return hit;
}

export function listScenarios(): ScenarioDefinition[] {
  return [...SCENARIO_CATALOG];
}
