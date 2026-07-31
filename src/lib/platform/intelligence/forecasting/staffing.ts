import {
  buildExplanation,
  insufficientForecast,
} from "@/lib/platform/intelligence/forecasting/explanations";
import { roundTo, trendFromRate } from "@/lib/platform/intelligence/forecasting/models";
import type {
  DomainForecast,
  ForecastingHistoryBundle,
  ScenarioDefinition,
} from "@/lib/platform/intelligence/forecasting/types";

const TARGET_STUDENTS_PER_TEACHER = 18;

export function forecastStaffing(input: {
  history: ForecastingHistoryBundle;
  scenario: ScenarioDefinition;
  horizonDays: number;
  /** Projected enrollment when available from enrollment model. */
  projectedEnrollment?: number | null;
}): DomainForecast {
  const horizonLabel = `${input.horizonDays}-day`;
  const students =
    input.projectedEnrollment ?? input.history.current.activeStudents;
  const staff = input.history.current.activeStaff;

  if (students == null || staff == null) {
    return insufficientForecast({
      domain: "staffing",
      label: "Staffing",
      unit: "teachers",
      horizonLabel,
      reason:
        "Insufficient historical data: active students and active staff are required to project staffing needs.",
    });
  }

  const targetRatio =
    TARGET_STUDENTS_PER_TEACHER * input.scenario.multipliers.studentsPerTeacher;
  const requiredTeachers = roundTo(students / targetRatio, 0);
  const shortage = roundTo(Math.max(0, requiredTeachers - staff), 0);
  const hiringNeeds = roundTo(
    shortage * input.scenario.multipliers.hiringPace,
    0
  );
  const utilization = roundTo((students / (staff * targetRatio)) * 100, 1);

  return {
    domain: "staffing",
    label: "Staffing",
    status: "ready",
    projectedValue: requiredTeachers,
    unit: "teachers required",
    horizonLabel,
    trend: trendFromRate(shortage > 0 ? 0.05 : shortage < 0 ? -0.05 : 0),
    insufficientReason: null,
    details: {
      requiredTeachers,
      staffingShortage: shortage,
      hiringNeeds,
      studentsPerTeacherTarget: roundTo(targetRatio, 2),
      teacherUtilizationPct: utilization,
    },
    explanation: buildExplanation({
      assumptions: [
        {
          key: "target_ratio",
          label: "Target students per teacher",
          value: roundTo(targetRatio, 2),
          unit: "students/teacher",
          source: `catalog 18 × scenario studentsPerTeacher ${input.scenario.multipliers.studentsPerTeacher}`,
        },
        {
          key: "hiring_pace",
          label: "Hiring pace multiplier",
          value: input.scenario.multipliers.hiringPace,
          unit: "x",
          source: `scenario:${input.scenario.id}`,
        },
      ],
      supportingData: [
        {
          key: "students",
          label: "Students in forecast basis",
          value: students,
          source: input.projectedEnrollment != null
            ? "enrollment forecast"
            : "founder.metrics.active_students",
        },
        {
          key: "active_staff",
          label: "Current active staff",
          value: staff,
          source: "founder.metrics.active_staff",
        },
      ],
      calculationSummary: `required_teachers = round(students ÷ target_ratio) = round(${students} ÷ ${roundTo(targetRatio, 2)}) = ${requiredTeachers}; shortage = max(0, required − staff) = ${shortage}; hiring_needs = round(shortage × hiring_pace) = round(${shortage} × ${input.scenario.multipliers.hiringPace}) = ${hiringNeeds}.`,
      confidenceNotes: [
        "Target ratio is a published operating assumption (18:1), not an ML estimate.",
        "When an enrollment forecast is available it is used as the student basis; otherwise current enrollment is used.",
      ],
    }),
  };
}
