/**
 * P008 — Mission Control feed transport projection (no metadata / assignment bloat).
 */

export const MISSION_CONTROL_FEED_COLS =
  "id, title, body, severity, href, module, item_type, entity_type, entity_id, created_at, school_id, assigned_role, assigned_user_id" as const;

export interface MissionControlFeedItemDto {
  id: string;
  title: string;
  body: string | null;
  severity: string | null;
  href: string | null;
  module: string;
  item_type: string;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
  school_id: string | null;
  assigned_role: string | null;
  assigned_user_id: string | null;
}
