import type { Microsoft365ObjectType } from "@/lib/platform/integrations/connectors/microsoft-365/entities";

export const TEAMS_OBJECT_TYPES = [
  "meet",
  "chat",
  "team",
  "channel",
] as const satisfies readonly Microsoft365ObjectType[];

export type TeamsObjectType = (typeof TEAMS_OBJECT_TYPES)[number];

export function isTeamsObjectType(value: string): value is TeamsObjectType {
  return (TEAMS_OBJECT_TYPES as readonly string[]).includes(value);
}

export const TEAMS_SYNC_TYPES: readonly Microsoft365ObjectType[] = [
  ...TEAMS_OBJECT_TYPES,
];
