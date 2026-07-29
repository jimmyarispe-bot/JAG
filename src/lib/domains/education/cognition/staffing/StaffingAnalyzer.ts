import {
  EDUCATION_CAPABILITY_IDS,
  EDUCATION_ENTITY_IDS,
  EDUCATION_POLICY_IDS,
} from "../../knowledge";
import type { StaffingObservation } from "./StaffingObservation";
import type { StaffingEvidenceCode } from "./StaffingTypes";

export interface StaffingAnalysis {
  signals: StaffingEvidenceCode[];
  overloadedTeacherIds: string[];
  qualificationGaps: string[];
  coverageOk: boolean;
  knowledgeRefs: {
    capabilityId: string;
    entityIds: readonly string[];
    policyIds: readonly string[];
  };
}

export function analyzeStaffing(observation: StaffingObservation): StaffingAnalysis {
  const teachers = observation.teachers ?? [];
  const assignments = observation.assignments ?? [];
  const signals: StaffingEvidenceCode[] = ["staffing_bound"];

  if (teachers.length === 0 && assignments.length === 0) {
    return {
      signals: ["insufficient_staffing_data", "staffing_bound"],
      overloadedTeacherIds: [],
      qualificationGaps: [],
      coverageOk: false,
      knowledgeRefs: knowledgeRefs(),
    };
  }

  const byTeacher = new Map(teachers.map((t) => [t.teacherId, t] as const));
  const loadByTeacher = new Map<string, number>();

  for (const a of assignments) {
    const units = a.loadUnits ?? 1;
    loadByTeacher.set(a.teacherId, (loadByTeacher.get(a.teacherId) ?? 0) + units);
  }

  const overloadedTeacherIds: string[] = [];
  for (const t of teachers) {
    const load = t.load ?? loadByTeacher.get(t.teacherId) ?? 0;
    const max = t.maxLoad ?? 5;
    if (load > max || t.available === false) {
      overloadedTeacherIds.push(t.teacherId);
    }
  }

  const qualificationGaps: string[] = [];
  for (const a of assignments) {
    if (!a.requiredCertification) continue;
    const teacher = byTeacher.get(a.teacherId);
    const certs = teacher?.certifications ?? [];
    if (!certs.includes(a.requiredCertification)) {
      qualificationGaps.push(
        `${a.assignmentId}:${a.teacherId} missing ${a.requiredCertification}`
      );
    }
  }

  const uncovered = assignments.filter((a) => !byTeacher.has(a.teacherId));
  const coverageOk =
    uncovered.length === 0 &&
    overloadedTeacherIds.length === 0 &&
    qualificationGaps.length === 0;

  if (overloadedTeacherIds.length > 0) signals.push("teacher_overload");
  if (qualificationGaps.length > 0) signals.push("qualification_gap");
  if (coverageOk) {
    signals.push("coverage_ok", "load_balanced");
  }

  return {
    signals: [...new Set(signals)],
    overloadedTeacherIds,
    qualificationGaps,
    coverageOk,
    knowledgeRefs: knowledgeRefs(),
  };
}

function knowledgeRefs() {
  return {
    capabilityId: EDUCATION_CAPABILITY_IDS.staffing,
    entityIds: [
      EDUCATION_ENTITY_IDS.teacher,
      EDUCATION_ENTITY_IDS.teachingAssignment,
      EDUCATION_ENTITY_IDS.instructionalLoad,
      EDUCATION_ENTITY_IDS.section,
    ],
    policyIds: [
      EDUCATION_POLICY_IDS.teacherLoad,
      EDUCATION_POLICY_IDS.programStaffingRequirements,
    ],
  };
}
