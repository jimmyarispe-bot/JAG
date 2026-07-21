import type { GoogleWorkspaceObjectType } from "@/lib/platform/integrations/connectors/google-workspace/entities";

/** Drive SoR object types ingested by RC-2.05 (metadata only). */
export const DRIVE_OBJECT_TYPES = [
  "drive_file",
  "drive_folder",
] as const satisfies readonly GoogleWorkspaceObjectType[];

export type DriveObjectType = (typeof DRIVE_OBJECT_TYPES)[number];

export function isDriveObjectType(objectType: string): objectType is DriveObjectType {
  return (DRIVE_OBJECT_TYPES as readonly string[]).includes(objectType);
}
