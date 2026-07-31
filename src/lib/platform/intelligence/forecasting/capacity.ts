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

/** Assumed classroom seats per teacher (catalog). */
const SEATS_PER_TEACHER = 20;
/** Virtual seats available per active staff FTE (catalog). */
const VIRTUAL_SEATS_PER_STAFF = 8;

export function forecastCapacity(input: {
  history: ForecastingHistoryBundle;
  scenario: ScenarioDefinition;
  horizonDays: number;
  projectedEnrollment?: number | null;
}): DomainForecast {
  const horizonLabel = `${input.horizonDays}-day`;
  const students =
    input.projectedEnrollment ?? input.history.current.activeStudents;
  const staff = input.history.current.activeStaff;

  if (students == null || staff == null) {
    return insufficientForecast({
      domain: "capacity",
      label: "Capacity",
      unit: "% utilization",
      horizonLabel,
      reason:
        "Insufficient historical data: active students and active staff are required for capacity utilization.",
    });
  }

  const classroomSeats = roundTo(
    staff * SEATS_PER_TEACHER * input.scenario.multipliers.seatCapacity,
    0
  );
  const virtualSeats = roundTo(
    staff * VIRTUAL_SEATS_PER_STAFF * input.scenario.multipliers.seatCapacity,
    0
  );
  const classroomUtil = roundTo(
    classroomSeats > 0 ? (students / classroomSeats) * 100 : 0,
    1
  );
  const virtualUtil = roundTo(
    virtualSeats > 0 ? (students * 0.35) / virtualSeats * 100 : 0,
    1
  );
  const teacherUtil = roundTo(
    (students / (staff * SEATS_PER_TEACHER)) * 100 /
      input.scenario.multipliers.seatCapacity,
    1
  );

  return {
    domain: "capacity",
    label: "Capacity",
    status: "ready",
    projectedValue: classroomUtil,
    unit: "% classroom utilization",
    horizonLabel,
    trend: trendFromRate(classroomUtil >= 90 ? 0.05 : classroomUtil <= 60 ? -0.05 : 0),
    insufficientReason: null,
    details: {
      classroomUtilizationPct: classroomUtil,
      virtualSeatUtilizationPct: virtualUtil,
      teacherUtilizationPct: teacherUtil,
      classroomSeats,
      virtualSeats,
    },
    explanation: buildExplanation({
      assumptions: [
        {
          key: "seats_per_teacher",
          label: "Classroom seats per teacher",
          value: SEATS_PER_TEACHER,
          unit: "seats",
          source: "assumption catalog",
        },
        {
          key: "virtual_seats_per_staff",
          label: "Virtual seats per staff",
          value: VIRTUAL_SEATS_PER_STAFF,
          unit: "seats",
          source: "assumption catalog",
        },
        {
          key: "seat_capacity_mult",
          label: `${input.scenario.label} seat capacity multiplier`,
          value: input.scenario.multipliers.seatCapacity,
          unit: "x",
          source: `scenario:${input.scenario.id}`,
        },
        {
          key: "virtual_load_share",
          label: "Virtual load share of enrollment",
          value: 35,
          unit: "%",
          source: "assumption catalog",
        },
      ],
      supportingData: [
        {
          key: "students",
          label: "Students in forecast basis",
          value: students,
          source:
            input.projectedEnrollment != null
              ? "enrollment forecast"
              : "founder.metrics.active_students",
        },
        {
          key: "staff",
          label: "Active staff",
          value: staff,
          source: "founder.metrics.active_staff",
        },
      ],
      calculationSummary: `classroom_seats = staff × ${SEATS_PER_TEACHER} × seat_capacity = ${staff} × ${SEATS_PER_TEACHER} × ${input.scenario.multipliers.seatCapacity} = ${classroomSeats}; classroom_utilization% = round(students ÷ seats × 100) = round(${students} ÷ ${classroomSeats} × 100) = ${classroomUtil}; virtual_utilization% = round((students × 0.35) ÷ virtual_seats × 100) = ${virtualUtil}.`,
      confidenceNotes: [
        "Seat densities are published catalog constants, not learned from data.",
        "Virtual load share is fixed at 35% of enrollment for transparency.",
      ],
    }),
  };
}
