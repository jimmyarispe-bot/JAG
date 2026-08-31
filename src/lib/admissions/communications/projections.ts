/**
 * P008 — column projections + transport DTOs for admissions communications.
 */

/** Lead fields required to build MergeContext (plus schools.name + staff notify fields). */
export const LEAD_MERGE_CONTEXT_COLS =
  "id, school_id, assigned_to_user_id, first_name, last_name, preferred_name, guardian_first_name, guardian_last_name, guardian_email, guardian_phone, program, schools(name, admissions_contact_name, admissions_contact_email, admissions_booking_url)" as const;

/** Full template shape used by deliver/render paths. */
export const COMMUNICATION_TEMPLATE_COLS =
  "id, school_id, template_key, name, channel, trigger_event, subject, body, delay_hours, is_active, category, version_number, description" as const;

/** Queue worker only needs ids + custom overrides + nested template. */
export const COMMUNICATION_QUEUE_PROCESS_COLS =
  `id, lead_id, application_id, custom_subject, custom_body, admissions_communication_templates(${COMMUNICATION_TEMPLATE_COLS})` as const;

/** Interview/tour reminder scheduling only needs template identity + channel. */
export const COMMUNICATION_TEMPLATE_QUEUE_COLS =
  "id, template_key, channel" as const;

export const STAFF_NOTIFICATION_COLS =
  "id, title, body, lead_id, created_at, notification_type, read_at" as const;

export const PORTAL_NOTIFICATION_COLS =
  "id, title, body, lead_id, application_id, created_at, read_at" as const;

export const QUEUED_COMMUNICATION_COLS =
  "id, lead_id, application_id, template_key, trigger_event, channel, scheduled_for, status, custom_subject, custom_body" as const;

export const TIMELINE_COMMUNICATION_COLS =
  "id, communication_type, subject, body, sent_at, delivery_status, open_status, template_key, users(full_name)" as const;

export const TIMELINE_NOTE_COLS =
  "id, note_text, created_at, users(full_name)" as const;

export const TIMELINE_STAGE_COLS =
  "id, previous_stage, new_stage, changed_at, users(full_name)" as const;

export const TIMELINE_DECISION_COLS =
  "id, decision_type, decision_notes, email_subject, decided_at, users(full_name)" as const;

export const STAGE_HISTORY_VELOCITY_COLS =
  "id, lead_id, previous_stage, new_stage, changed_by, changed_at" as const;

export interface StaffNotificationDto {
  id: string;
  title: string;
  body: string;
  lead_id: string | null;
  created_at: string;
  notification_type: string;
  read_at?: string | null;
}
