import type { Microsoft365ObjectType } from "@/lib/platform/integrations/connectors/microsoft-365/entities";

export const GROUPS_OBJECT_TYPES = [
  "directory_group",
  "team",
  "channel",
] as const satisfies readonly Microsoft365ObjectType[];

export function normalizeGroupAttributes(
  objectType: string,
  payload: Record<string, unknown>
): Record<string, unknown> {
  if (objectType === "channel") {
    return {
      name: payload.name ?? payload.displayName,
      teamId: payload.teamId ?? null,
      memberCount: payload.memberCount ?? 0,
    };
  }
  return {
    name: payload.name ?? payload.displayName,
    email: payload.email ?? payload.mail ?? null,
    memberCount: payload.memberCount ?? 0,
    teamId: payload.teamId ?? null,
  };
}
