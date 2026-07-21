/**
 * Calendar OAuth scopes — readonly event metadata (attendees, rooms, meet links).
 */

export const CALENDAR_OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
] as const;

export type CalendarOAuthScope = (typeof CALENDAR_OAUTH_SCOPES)[number];
