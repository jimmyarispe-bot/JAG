/**
 * P008 — platform relationship transport columns (typed PlatformRelationship shape).
 */

export const PLATFORM_RELATIONSHIP_COLS =
  "id, organization_id, school_id, relationship_type, from_entity_type, from_entity_id, to_entity_type, to_entity_id, is_primary, effective_date, end_date, status, source, notes, metadata, created_by, created_at, updated_at" as const;

export const RELATIONSHIP_TYPE_DEF_COLS =
  "type_key, label, from_entity_type, to_entity_type, description, is_system, sort_order" as const;

export const AUTHORIZED_CONTACT_COLS =
  "id, first_name, last_name, contact_type, phone, email, custody_notes, can_pick_up, is_emergency_contact, students(first_name, last_name)" as const;

export const FAMILY_GUARDIAN_PROFILE_COLS =
  "id, first_name, last_name, is_primary, relationship_to_student, contact_type, email, phone, user_id, receives_billing, financial_responsibility_percent" as const;
