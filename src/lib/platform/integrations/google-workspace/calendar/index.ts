/**
 * RC-2.04 — Calendar Connector
 * Ingests Calendar / Meet metadata and produces canonical Meeting / CalendarEvent /
 * Attendee / Room / Resource entities only.
 */

export {
  CALENDAR_OBJECT_TYPES,
  isCalendarObjectType,
  type CalendarObjectType,
} from "@/lib/platform/integrations/google-workspace/calendar/object-types";

export {
  CALENDAR_OAUTH_SCOPES,
  type CalendarOAuthScope,
} from "@/lib/platform/integrations/google-workspace/calendar/scopes";

export {
  CALENDAR_CANONICAL_KINDS,
  type CalendarCanonicalKind,
  type CalendarAttendeeRef,
  type CalendarFetchOptions,
  type CalendarListPage,
  type CalendarSyncSliceOptions,
  type CalendarSyncSliceResult,
} from "@/lib/platform/integrations/google-workspace/calendar/types";

export {
  normalizeCalendarAttributes,
  normalizeCalendarEventAttributes,
  normalizeMeetSessionAttributes,
  parseCalendarAttendees,
} from "@/lib/platform/integrations/google-workspace/calendar/normalize";

export {
  calendarEventForRecord,
  meetEventForRecord,
  eventTypeForCalendarCanonical,
} from "@/lib/platform/integrations/google-workspace/calendar/events";

export { deriveCalendarCanonicalEntities } from "@/lib/platform/integrations/google-workspace/calendar/derive";

export {
  CalendarClient,
  createCalendarClient,
  type CalendarClientOptions,
} from "@/lib/platform/integrations/google-workspace/calendar/client";

export {
  syncCalendarSlice,
  calendarSyncObjectTypes,
} from "@/lib/platform/integrations/google-workspace/calendar/sync";
