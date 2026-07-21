import type { Microsoft365ObjectType } from "@/lib/platform/integrations/connectors/microsoft-365/entities";
import { OUTLOOK_OBJECT_TYPES } from "@/lib/platform/integrations/connectors/microsoft-365/outlook";

export type OutlookObjectType = (typeof OUTLOOK_OBJECT_TYPES)[number];

export { OUTLOOK_OBJECT_TYPES };

export function isOutlookObjectType(
  value: string
): value is OutlookObjectType {
  return (OUTLOOK_OBJECT_TYPES as readonly string[]).includes(value);
}

export const OUTLOOK_SYNC_TYPES: readonly Microsoft365ObjectType[] = [
  ...OUTLOOK_OBJECT_TYPES,
];
