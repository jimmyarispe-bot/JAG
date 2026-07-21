/**
 * P008 — operational-loop audit reads only need metadata + identity columns.
 * Omits before_state / after_state / summary / ip_address and other audit bloat.
 */

export const LOOP_AUDIT_EVENT_COLS =
  "id, entity_id, school_id, actor_user_id, created_at, metadata" as const;
