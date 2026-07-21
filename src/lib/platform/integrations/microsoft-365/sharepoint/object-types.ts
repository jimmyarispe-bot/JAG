import type { Microsoft365ObjectType } from "@/lib/platform/integrations/connectors/microsoft-365/entities";
import { SHAREPOINT_OBJECT_TYPES } from "@/lib/platform/integrations/connectors/microsoft-365/sharepoint";

export type SharePointObjectType = (typeof SHAREPOINT_OBJECT_TYPES)[number];

export { SHAREPOINT_OBJECT_TYPES };

export function isSharePointObjectType(value: string): value is SharePointObjectType {
  return (SHAREPOINT_OBJECT_TYPES as readonly string[]).includes(value);
}

export const SHAREPOINT_SYNC_TYPES: readonly Microsoft365ObjectType[] = [
  ...SHAREPOINT_OBJECT_TYPES,
];
