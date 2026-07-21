import type { Microsoft365ObjectType } from "@/lib/platform/integrations/connectors/microsoft-365/entities";
import { ONEDRIVE_OBJECT_TYPES } from "@/lib/platform/integrations/connectors/microsoft-365/onedrive";

export type OneDriveObjectType = (typeof ONEDRIVE_OBJECT_TYPES)[number];

export { ONEDRIVE_OBJECT_TYPES };

export function isOneDriveObjectType(value: string): value is OneDriveObjectType {
  return (ONEDRIVE_OBJECT_TYPES as readonly string[]).includes(value);
}

export const ONEDRIVE_SYNC_TYPES: readonly Microsoft365ObjectType[] = [
  ...ONEDRIVE_OBJECT_TYPES,
];
