import type { Microsoft365ObjectType } from "@/lib/platform/integrations/connectors/microsoft-365/entities";
import { CALENDAR_OBJECT_TYPES } from "@/lib/platform/integrations/connectors/microsoft-365/calendar";

export type CalendarObjectType = (typeof CALENDAR_OBJECT_TYPES)[number];

export { CALENDAR_OBJECT_TYPES };

export function isCalendarObjectType(value: string): value is CalendarObjectType {
  return (CALENDAR_OBJECT_TYPES as readonly string[]).includes(value);
}

export const CALENDAR_SYNC_TYPES: readonly Microsoft365ObjectType[] = [
  ...CALENDAR_OBJECT_TYPES,
];
