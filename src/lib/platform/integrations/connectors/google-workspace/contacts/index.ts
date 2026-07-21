/**
 * Contacts domain — people and organizations (metadata).
 */

import type { PlatformEventType } from "@/lib/platform/integrations/events/event-types";
import type { GoogleWorkspaceObjectType } from "@/lib/platform/integrations/connectors/google-workspace/entities";

export const CONTACTS_OBJECT_TYPES = [
  "contact",
] as const satisfies readonly GoogleWorkspaceObjectType[];

export function contactsEventForRecord(_payload: Record<string, unknown>): PlatformEventType {
  return "CONTACT_UPSERTED";
}

export function normalizeContactAttributes(
  payload: Record<string, unknown>
): Record<string, unknown> {
  return {
    name: payload.name ?? payload.displayName,
    email: payload.email ?? null,
    organization: payload.organization ?? payload.organizationName ?? null,
    title: payload.title ?? payload.jobTitle ?? null,
    phone: payload.phone ?? null,
    kind: payload.organization ? "person_in_org" : "person",
  };
}
