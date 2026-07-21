/**
 * Directory domain — users, groups, organizational units (when available).
 */

import type { PlatformEventType } from "@/lib/platform/integrations/events/event-types";
import type { GoogleWorkspaceObjectType } from "@/lib/platform/integrations/connectors/google-workspace/entities";

export const DIRECTORY_OBJECT_TYPES = [
  "directory_user",
  "directory_group",
  "organizational_unit",
] as const satisfies readonly GoogleWorkspaceObjectType[];

export function directoryEventForRecord(
  objectType: string,
  _payload: Record<string, unknown>
): PlatformEventType | null {
  if (objectType === "directory_user") return "USER_CREATED";
  return null;
}

export function normalizeDirectoryAttributes(
  objectType: string,
  payload: Record<string, unknown>
): Record<string, unknown> {
  if (objectType === "directory_user") {
    return {
      name: payload.name,
      email: payload.email,
      orgUnitPath: payload.orgUnitPath ?? null,
      status: payload.status ?? "active",
    };
  }
  if (objectType === "directory_group") {
    return {
      name: payload.name,
      email: payload.email,
      memberCount: payload.memberCount ?? 0,
    };
  }
  return {
    name: payload.name,
    orgUnitPath: payload.orgUnitPath ?? null,
    parentPath: payload.parentPath ?? null,
  };
}
