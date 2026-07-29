import {
  EDUCATION_CAPABILITY_IDS,
  EDUCATION_ENTITY_IDS,
  EDUCATION_POLICY_IDS,
} from "../../knowledge";
import type { CapacityObservation } from "./CapacityObservation";
import type { CapacityEvidenceCode } from "./CapacityTypes";

export interface CapacityAnalysis {
  signals: CapacityEvidenceCode[];
  utilization: number;
  overCapacitySectionIds: string[];
  underUtilizedSectionIds: string[];
  knowledgeRefs: {
    capabilityId: string;
    entityIds: readonly string[];
    policyIds: readonly string[];
  };
}

export function analyzeCapacity(observation: CapacityObservation): CapacityAnalysis {
  const sections = observation.sections ?? [];
  const signals: CapacityEvidenceCode[] = ["capacity_bound"];

  if (
    sections.length === 0 &&
    observation.campusSeats === undefined &&
    observation.campusEnrolled === undefined
  ) {
    return {
      signals: ["insufficient_capacity_data", "capacity_bound"],
      utilization: 0,
      overCapacitySectionIds: [],
      underUtilizedSectionIds: [],
      knowledgeRefs: knowledgeRefs(),
    };
  }

  const underThreshold = observation.underUtilizationThreshold ?? 0.5;
  const overCapacitySectionIds: string[] = [];
  const underUtilizedSectionIds: string[] = [];
  let totalSeats = 0;
  let totalEnrolled = 0;

  for (const s of sections) {
    const seats = s.seats + (s.virtualSeats ?? 0);
    totalSeats += seats;
    totalEnrolled += s.enrolled;
    if (seats > 0 && s.enrolled > seats) {
      overCapacitySectionIds.push(s.sectionId);
    } else if (seats > 0 && s.enrolled / seats < underThreshold) {
      underUtilizedSectionIds.push(s.sectionId);
    }
  }

  if (observation.campusSeats !== undefined) {
    totalSeats = Math.max(totalSeats, observation.campusSeats);
  }
  if (observation.campusEnrolled !== undefined) {
    totalEnrolled = Math.max(totalEnrolled, observation.campusEnrolled);
  }

  const utilization = totalSeats > 0 ? totalEnrolled / totalSeats : 0;

  if (overCapacitySectionIds.length > 0) signals.push("over_capacity");
  if (underUtilizedSectionIds.length > 0) signals.push("under_utilized");
  if (
    overCapacitySectionIds.length === 0 &&
    underUtilizedSectionIds.length === 0 &&
    (sections.length > 0 || totalSeats > 0)
  ) {
    signals.push("capacity_healthy");
  }

  return {
    signals: [...new Set(signals)],
    utilization,
    overCapacitySectionIds,
    underUtilizedSectionIds,
    knowledgeRefs: knowledgeRefs(),
  };
}

function knowledgeRefs() {
  return {
    capabilityId: EDUCATION_CAPABILITY_IDS.capacity,
    entityIds: [
      EDUCATION_ENTITY_IDS.capacityUnit,
      EDUCATION_ENTITY_IDS.section,
      EDUCATION_ENTITY_IDS.program,
      EDUCATION_ENTITY_IDS.campus,
      EDUCATION_ENTITY_IDS.classroom,
    ],
    policyIds: [EDUCATION_POLICY_IDS.maximumClassSize],
  };
}
