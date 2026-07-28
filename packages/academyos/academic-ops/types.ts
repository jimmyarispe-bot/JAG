/** Academic Operations™ — scheduling, classes, sessions, teacher workspace. */

export const CALENDAR_KINDS = [
  "Traditional",
  "Year-round",
  "Hybrid",
  "Virtual",
] as const;
export type CalendarKind = (typeof CALENDAR_KINDS)[number];

export const CLASS_STATUSES = [
  "Draft",
  "Active",
  "Waitlisted",
  "Cancelled",
  "Archived",
] as const;
export type ClassStatus = (typeof CLASS_STATUSES)[number];

export const SESSION_STATUSES = [
  "Scheduled",
  "In Progress",
  "Completed",
  "Cancelled",
  "Rescheduled",
  "Make-up",
] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

export const LESSON_STATUSES = [
  "Planned",
  "Delivered",
  "Partial",
  "Skipped",
] as const;
export type LessonStatus = (typeof LESSON_STATUSES)[number];

export const STUDENT_SCHEDULE_KINDS = [
  "Core",
  "Intervention",
  "Therapy",
  "Virtual Tutoring",
  "Elective",
] as const;
export type StudentScheduleKind = (typeof STUDENT_SCHEDULE_KINDS)[number];

export const CLASSROOM_NOTE_KINDS = [
  "Session Summary",
  "Student Observation",
  "Follow-up",
  "Parent Communication",
] as const;
export type ClassroomNoteKind = (typeof CLASSROOM_NOTE_KINDS)[number];

export type AcademicTerm = {
  readonly id: string;
  readonly name: string;
  readonly kind: "Term" | "Quarter" | "Semester";
  readonly startsOn: string;
  readonly endsOn: string;
};

export type AcademicBreak = {
  readonly id: string;
  readonly name: string;
  readonly kind: "Break" | "Holiday" | "Teacher Workday" | "Assessment Window";
  readonly startsOn: string;
  readonly endsOn: string;
};

export type AcademicCalendar = {
  readonly id: string;
  readonly organizationId: string;
  readonly campusId: string | null;
  readonly name: string;
  readonly kind: CalendarKind;
  readonly timezone: string;
  readonly terms: readonly AcademicTerm[];
  readonly breaks: readonly AcademicBreak[];
  readonly twinEntityId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdBy: string;
};

export type TeacherAvailability = {
  readonly dayOfWeek: number; // 0=Sun … 6=Sat
  readonly startTime: string; // HH:mm
  readonly endTime: string;
};

export type AoTeacher = {
  readonly id: string;
  readonly organizationId: string;
  readonly displayName: string;
  readonly email: string | null;
  readonly campusIds: readonly string[];
  readonly subjects: readonly string[];
  readonly availability: readonly TeacherAvailability[];
  readonly timezone: string;
  readonly twinEntityId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdBy: string;
};

export type ClassPeriodSlot = {
  readonly dayOfWeek: number;
  readonly startTime: string;
  readonly endTime: string;
};

export type AoClass = {
  readonly id: string;
  readonly organizationId: string;
  readonly schoolId: string | null;
  readonly campusId: string | null;
  readonly program: string;
  readonly subject: string;
  readonly name: string;
  readonly gradeLevels: readonly string[];
  readonly teacherId: string;
  readonly teachingAssistantIds: readonly string[];
  readonly room: string | null;
  readonly virtualMeetingUrl: string | null;
  readonly isVirtual: boolean;
  readonly timezone: string;
  readonly capacity: number;
  readonly currentEnrollment: number;
  readonly waitlistCount: number;
  readonly schedule: readonly ClassPeriodSlot[];
  readonly status: ClassStatus;
  readonly calendarId: string | null;
  readonly twinEntityId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdBy: string;
};

export type WaitlistEntry = {
  readonly id: string;
  readonly organizationId: string;
  readonly classId: string;
  readonly studentId: string;
  readonly position: number;
  readonly createdAt: string;
};

export type StudentClassEnrollment = {
  readonly id: string;
  readonly organizationId: string;
  readonly classId: string;
  readonly studentId: string;
  readonly kind: StudentScheduleKind;
  readonly status: "Active" | "Waitlisted" | "Dropped";
  readonly startsOn: string;
  readonly endsOn: string | null;
  readonly createdAt: string;
  readonly createdBy: string;
};

export type InstructionalSession = {
  readonly id: string;
  readonly organizationId: string;
  readonly classId: string;
  readonly date: string;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly teacherId: string;
  readonly substituteTeacherId: string | null;
  readonly studentIds: readonly string[];
  readonly status: SessionStatus;
  readonly lessonStatus: LessonStatus;
  readonly notes: string;
  readonly makeUpForSessionId: string | null;
  readonly twinEntityId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdBy: string;
};

export type ClassroomNote = {
  readonly id: string;
  readonly organizationId: string;
  readonly sessionId: string;
  readonly classId: string;
  readonly studentId: string | null;
  readonly kind: ClassroomNoteKind;
  readonly body: string;
  readonly twinEntityId: string | null;
  readonly createdAt: string;
  readonly createdBy: string;
};

export type AcademicOperationsSummary = {
  readonly organizationId: string;
  readonly classesToday: number;
  readonly attendanceRate: number;
  readonly teacherUtilization: number;
  readonly classCapacityUtilization: number;
  readonly waitlistTotal: number;
  readonly cancellations: number;
  readonly sessionCompletionRate: number;
  readonly instructionalHoursDelivered: number;
};
