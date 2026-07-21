import type { GoogleWorkspaceRawEntity } from "@/lib/platform/integrations/connectors/google-workspace/entities";
import type { CalendarObjectType } from "@/lib/platform/integrations/google-workspace/calendar/object-types";

/** Canonical kinds produced by the Calendar connector (never raw Google Calendar). */
export const CALENDAR_CANONICAL_KINDS = [
  "Meeting",
  "CalendarEvent",
  "Attendee",
  "Room",
  "Resource",
] as const;

export type CalendarCanonicalKind = (typeof CALENDAR_CANONICAL_KINDS)[number];

export type CalendarAttendeeRef = {
  email: string;
  displayName: string | null;
  responseStatus: string | null;
  optional: boolean;
  organizer: boolean;
  domain: string;
  isInternal: boolean;
};

export type CalendarListPage = {
  records: GoogleWorkspaceRawEntity[];
  nextCursor: string | null;
};

export type CalendarFetchOptions = {
  organizationId: string;
  objectType: CalendarObjectType;
  since?: string | null;
  cursor?: string | null;
};

export type CalendarSyncSliceOptions = {
  organizationId: string;
  connectionId: string;
  accessToken: string;
  forceFull?: boolean;
  objectTypes?: readonly CalendarObjectType[];
};

export type CalendarSyncSliceResult = {
  objectType: CalendarObjectType;
  fetched: number;
  normalized: number;
  derived: number;
  cursor: string | null;
  records: GoogleWorkspaceRawEntity[];
};
