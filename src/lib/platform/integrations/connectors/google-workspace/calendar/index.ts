/**
 * Compatibility shim — RC-2.04 implementation lives in
 * `src/lib/platform/integrations/google-workspace/calendar/`.
 */

export {
  CALENDAR_OBJECT_TYPES,
  isCalendarObjectType,
  calendarEventForRecord,
  meetEventForRecord,
  eventTypeForCalendarCanonical,
  normalizeCalendarEventAttributes,
  normalizeMeetSessionAttributes,
  type CalendarObjectType,
} from "@/lib/platform/integrations/google-workspace/calendar";

import { normalizeCalendarEventAttributes } from "@/lib/platform/integrations/google-workspace/calendar";

/** Legacy single-arg normalizer used by older call sites. */
export function normalizeCalendarAttributes(
  payload: Record<string, unknown>
): Record<string, unknown> {
  return normalizeCalendarEventAttributes(payload);
}
