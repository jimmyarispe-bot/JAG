import type { GoogleWorkspaceObjectType } from "@/lib/platform/integrations/connectors/google-workspace/entities";

/** Gmail SoR object types ingested by RC-2.03 (metadata only). */
export const GMAIL_OBJECT_TYPES = [
  "message",
  "thread",
  "label",
  "attachment",
] as const satisfies readonly GoogleWorkspaceObjectType[];

export type GmailObjectType = (typeof GMAIL_OBJECT_TYPES)[number];

export function isGmailObjectType(objectType: string): objectType is GmailObjectType {
  return (GMAIL_OBJECT_TYPES as readonly string[]).includes(objectType);
}
