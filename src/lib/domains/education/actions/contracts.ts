/**
 * Education action contracts — catalog definitions only.
 * No execution / workflow / SoR mutation in D1.
 */

import type { ActionCatalogEntry } from "@/lib/jag/runtime";
import {
  EDUCATION_ACTION_IDS,
  EDUCATION_PERMISSIONS,
} from "../types";

export type EducationActionId =
  (typeof EDUCATION_ACTION_IDS)[keyof typeof EDUCATION_ACTION_IDS];

/** Canonical Education action catalog (contracts). */
export const EDUCATION_ACTION_CATALOG: readonly ActionCatalogEntry[] = [
  {
    actionId: EDUCATION_ACTION_IDS.approveEnrollment,
    kind: "approve",
    permission: EDUCATION_PERMISSIONS.enrollmentApprove,
    label: "Approve Enrollment",
    requiresConfirmation: true,
    requiresEvidence: true,
    requiresCognition: true,
  },
  {
    actionId: EDUCATION_ACTION_IDS.scheduleSession,
    kind: "schedule",
    permission: EDUCATION_PERMISSIONS.sessionSchedule,
    label: "Schedule Session",
    requiresEvidence: true,
    requiresCognition: true,
  },
  {
    actionId: EDUCATION_ACTION_IDS.recordAttendance,
    kind: "update",
    permission: EDUCATION_PERMISSIONS.attendanceRecord,
    label: "Record Attendance",
    requiresEvidence: true,
    requiresCognition: true,
  },
  {
    actionId: EDUCATION_ACTION_IDS.publishProgress,
    kind: "generate",
    permission: EDUCATION_PERMISSIONS.progressPublish,
    label: "Publish Progress",
    requiresEvidence: true,
    requiresCognition: true,
  },
] as const;

/** Foundation marker returned by placeholder execute. */
export const EDUCATION_ACTION_NOT_IMPLEMENTED = {
  code: "EDUCATION_FOUNDATION_NO_EXECUTION",
  message:
    "Education Domain foundation: action catalog registered; execution deferred",
} as const;
