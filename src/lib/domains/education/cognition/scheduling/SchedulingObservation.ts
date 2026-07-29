import type { EducationObservationBase } from "../framework";

export interface SchedulingSessionSlot {
  sessionId: string;
  sectionId: string;
  classroomId?: string;
  teacherId?: string;
  /** ISO date or weekday label */
  day: string;
  startTime: string;
  endTime: string;
  covered?: boolean;
}

export interface SchedulingSectionContract {
  sectionId: string;
  courseId?: string;
  programId?: string;
  enrolledCount?: number;
  teacherIds?: readonly string[];
}

export interface SchedulingObservation extends EducationObservationBase {
  /** Subject for ops (campus / program / org scope). */
  subject: { subjectId: string; label?: string };
  campusId?: string;
  programId?: string;
  bellScheduleId?: string;
  sections: readonly SchedulingSectionContract[];
  sessions: readonly SchedulingSessionSlot[];
  /** Optional host-declared max concurrent sessions per room/teacher. */
  constraints?: {
    disallowTeacherOverlap?: boolean;
    disallowRoomOverlap?: boolean;
  };
}

export function validateSchedulingObservation(
  observation: SchedulingObservation
): void {
  if (!observation.subject?.subjectId?.trim()) {
    throw new Error("Scheduling observation requires subject.subjectId");
  }
}
