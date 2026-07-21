export {
  CALENDAR_OBJECT_TYPES,
  CALENDAR_SYNC_TYPES,
  isCalendarObjectType,
  type CalendarObjectType,
} from "./object-types";
export { CalendarClient, createCalendarClient } from "./client";
export { deriveCalendarCanonicalEntities } from "./derive";
export {
  calendarEventForRecord,
  normalizeCalendarAttributes,
} from "@/lib/platform/integrations/connectors/microsoft-365/calendar";
