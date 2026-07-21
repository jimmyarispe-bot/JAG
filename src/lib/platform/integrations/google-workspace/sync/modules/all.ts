import { CALENDAR_SYNC_OBJECT_TYPES } from "@/lib/platform/integrations/google-workspace/sync/modules/calendar";
import { DRIVE_SYNC_OBJECT_TYPES } from "@/lib/platform/integrations/google-workspace/sync/modules/drive";
import { GMAIL_SYNC_OBJECT_TYPES } from "@/lib/platform/integrations/google-workspace/sync/modules/gmail";

/** Object types covered by upcoming domain connectors (RC-2.03–2.05). */
export const GOOGLE_WORKSPACE_DOMAIN_SYNC_TYPES = [
  ...GMAIL_SYNC_OBJECT_TYPES,
  ...CALENDAR_SYNC_OBJECT_TYPES,
  ...DRIVE_SYNC_OBJECT_TYPES,
] as const;
