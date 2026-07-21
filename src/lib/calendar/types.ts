export type CalendarEventType =
  | "class"
  | "meeting"
  | "parent_conference"
  | "iep"
  | "assessment"
  | "school_event"
  | "holiday"
  | "staff_meeting"
  | "training"
  | "reminder"
  | "workflow_scheduled";

export type CalendarEventStatus = "draft" | "scheduled" | "cancelled" | "completed";

export type ResourceType = "room" | "lab" | "vehicle" | "equipment" | "device" | "other";

export type AvailabilityType = "working_hours" | "break" | "pto" | "holiday" | "blocked";

export type CalendarView = "day" | "week" | "month" | "agenda";

export interface CalendarEventRow {
  id: string;
  audit_id: string;
  organization_id: string | null;
  school_id: string | null;
  title: string;
  description: string;
  event_type: CalendarEventType;
  status: CalendarEventStatus;
  starts_at: string;
  ends_at: string;
  timezone: string;
  all_day: boolean;
  recurrence_rule: string | null;
  recurrence_parent_id: string | null;
  is_exception: boolean;
  exception_original_starts_at: string | null;
  color: string | null;
  program: string | null;
  class_id: string | null;
  teacher_employee_id: string | null;
  student_ids: string[];
  family_id: string | null;
  resource_id: string | null;
  room_id: string | null;
  meet_url: string | null;
  meet_provider: string | null;
  meet_external_id: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  cancelled_at: string | null;
  metadata: Record<string, unknown> | null;
}

export interface CalendarOccurrence extends CalendarEventRow {
  occurrenceStartsAt: string;
  occurrenceEndsAt: string;
  isRecurringInstance: boolean;
}

export interface CreateCalendarEventInput {
  title: string;
  description?: string;
  eventType: CalendarEventType;
  startsAt: string;
  endsAt: string;
  timezone?: string;
  allDay?: boolean;
  recurrenceRule?: string | null;
  schoolId?: string | null;
  organizationId?: string | null;
  program?: string | null;
  classId?: string | null;
  teacherEmployeeId?: string | null;
  studentIds?: string[];
  familyId?: string | null;
  resourceId?: string | null;
  roomId?: string | null;
  color?: string | null;
  status?: CalendarEventStatus;
  createMeetLink?: boolean;
  skipConflictCheck?: boolean;
  metadata?: Record<string, unknown>;
  /** Reminder offsets in minutes before start (default 24h, 1h, 15m) */
  reminderOffsets?: number[];
}

export interface ConflictHit {
  kind: "teacher" | "student" | "resource" | "availability";
  message: string;
  entityId?: string;
  conflictingEventId?: string;
}

export interface CalendarResourceRow {
  id: string;
  school_id: string | null;
  name: string;
  resource_type: ResourceType;
  capacity: number | null;
  location: string | null;
  is_active: boolean;
}

export interface StaffAvailabilityRow {
  id: string;
  school_id: string | null;
  employee_id: string;
  availability_type: AvailabilityType;
  day_of_week: number | null;
  starts_at: string | null;
  ends_at: string | null;
  start_time: string | null;
  end_time: string | null;
  timezone: string;
  notes: string | null;
}
