/**
 * Host-supplied execution context for the Education Intelligence Orchestrator.
 * Observations are provided by the host — never loaded from a database here.
 */

import type { RuntimeIntent } from "@/lib/jag/runtime";
import type { AttendanceObservation } from "../attendance";
import type { CapacityObservation } from "../capacity";
import type { ComplianceObservation } from "../compliance";
import type { EnrollmentObservation } from "../enrollment";
import type { EducationPlannerContext } from "../planner";
import type { AcademicProgressObservation } from "../progress";
import type { SchedulingObservation } from "../scheduling";
import type { ScholarshipObservation } from "../scholarship";
import type { StaffingObservation } from "../staffing";

/**
 * Normalized observation bag. Hosts construct these; the orchestrator
 * only routes them to the matching contributor.
 */
export interface EducationNormalizedObservations {
  enrollment?: EnrollmentObservation;
  attendance?: AttendanceObservation;
  progress?: AcademicProgressObservation;
  scheduling?: SchedulingObservation;
  staffing?: StaffingObservation;
  capacity?: CapacityObservation;
  scholarship?: ScholarshipObservation;
  compliance?: ComplianceObservation;
  /**
   * Extensible map for future contributors
   * (keyed by contributor id or observation attribute key).
   */
  extras?: Readonly<Record<string, unknown>>;
}

export interface EducationExecutionContext {
  intent: RuntimeIntent;
  /** Planner selection context (focus tags, domain hints, etc.). */
  plannerContext?: EducationPlannerContext;
  /** Host-normalized observations for scheduled contributors. */
  observations: EducationNormalizedObservations;
  subjectId?: string;
  organizationId?: string;
  /** Override default planner catalog / clock. */
  now?: string;
  attributes?: Readonly<Record<string, unknown>>;
}
