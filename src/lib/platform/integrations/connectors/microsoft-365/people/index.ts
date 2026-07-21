import type { PlatformEventType } from "@/lib/platform/integrations/events/event-types";
import type { Microsoft365ObjectType } from "@/lib/platform/integrations/connectors/microsoft-365/entities";

export const PEOPLE_OBJECT_TYPES = [
  "contact",
  "directory_user",
] as const satisfies readonly Microsoft365ObjectType[];

export function peopleEventForRecord(objectType: string): PlatformEventType | null {
  if (objectType === "directory_user") return "USER_CREATED";
  if (objectType === "contact") return "CONTACT_UPSERTED";
  return null;
}

export function normalizePeopleAttributes(
  objectType: string,
  payload: Record<string, unknown>
): Record<string, unknown> {
  return {
    name: payload.name ?? payload.displayName,
    email: payload.email ?? payload.mail ?? null,
    organization: payload.organization ?? payload.companyName ?? null,
    title: payload.title ?? payload.jobTitle ?? null,
    orgUnitPath: payload.orgUnitPath ?? payload.department ?? null,
    status: payload.status ?? "active",
    kind: objectType === "contact" ? "person" : "user",
  };
}
