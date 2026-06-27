/** Canonical entity types for platform services (Activity, Tags, Notes, Relationships) */
export const PLATFORM_ENTITY_TYPES = [
  "student",
  "family",
  "guardian",
  "employee",
  "school",
  "campus",
  "organization",
  "department",
  "document",
  "enrollment",
  "class",
  "assessment",
  "scholarship",
  "grant",
  "invoice",
  "transportation_route",
  "admissions_lead",
] as const;

export type PlatformEntityType = (typeof PLATFORM_ENTITY_TYPES)[number];

export function isPlatformEntityType(value: string): value is PlatformEntityType {
  return (PLATFORM_ENTITY_TYPES as readonly string[]).includes(value);
}
