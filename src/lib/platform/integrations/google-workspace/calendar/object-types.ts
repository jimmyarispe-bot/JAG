import type { GoogleWorkspaceObjectType } from "@/lib/platform/integrations/connectors/google-workspace/entities";

/** Calendar SoR object types ingested by RC-2.04. */
export const CALENDAR_OBJECT_TYPES = [
  "calendar_event",
  "meet",
] as const satisfies readonly GoogleWorkspaceObjectType[];

export type CalendarObjectType = (typeof CALENDAR_OBJECT_TYPES)[number];

export function isCalendarObjectType(
  objectType: string
): objectType is CalendarObjectType {
  return (CALENDAR_OBJECT_TYPES as readonly string[]).includes(objectType);
}
