/**
 * Admissions stage machine — deterministic transitions.
 */

import {
  ADMISSIONS_STAGES,
  TERMINAL_STAGES,
  type AdmissionsStage,
} from "./types";

const FORWARD: Readonly<Record<AdmissionsStage, readonly AdmissionsStage[]>> = {
  Inquiry: ["Application Started", "Withdrawn"],
  "Application Started": ["Application Submitted", "Withdrawn"],
  "Application Submitted": ["Document Review", "Withdrawn"],
  "Document Review": [
    "Assessment Scheduled",
    "Admissions Review",
    "Withdrawn",
  ],
  "Assessment Scheduled": ["Assessment Complete", "Withdrawn"],
  "Assessment Complete": ["Admissions Review", "Withdrawn"],
  "Admissions Review": ["Accepted", "Declined", "Withdrawn"],
  Accepted: ["Enrollment Pending", "Withdrawn"],
  "Enrollment Pending": ["Enrolled", "Withdrawn"],
  Enrolled: [],
  Declined: [],
  Withdrawn: [],
};

export function canTransitionStage(
  from: AdmissionsStage,
  to: AdmissionsStage
): boolean {
  if (from === to) return true;
  if (TERMINAL_STAGES.includes(from)) return false;
  return FORWARD[from]?.includes(to) ?? false;
}

export function isAdmissionsStage(value: string): value is AdmissionsStage {
  return (ADMISSIONS_STAGES as readonly string[]).includes(value);
}

export function stageIndex(stage: AdmissionsStage): number {
  return ADMISSIONS_STAGES.indexOf(stage);
}
