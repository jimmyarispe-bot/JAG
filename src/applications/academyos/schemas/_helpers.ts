import type { PlatformSchema } from "@/lib/platform/schema";

export const APP = "academyos";

export function schemaIdFor(entityType: string): string {
  const slug = entityType
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/_/g, "-")
    .toLowerCase();
  return `academyos.${slug}`;
}

export function schema(input: {
  entityType: string;
  label: string;
  fields: PlatformSchema["fields"];
  permissions: PlatformSchema["permissions"];
  forms?: PlatformSchema["forms"];
  workflows?: PlatformSchema["workflows"];
  relationships?: PlatformSchema["relationships"];
  intelligence?: PlatformSchema["intelligence"];
  description?: string;
}): PlatformSchema {
  return {
    id: schemaIdFor(input.entityType),
    applicationId: APP,
    organizationId: null,
    entityType: input.entityType,
    version: "1.1.0",
    label: input.label,
    description: input.description ?? `${input.label} — AcademyOS domain`,
    extends: null,
    layer: "base",
    fields: input.fields,
    relationships: input.relationships ?? [],
    permissions: input.permissions,
    forms: input.forms ?? [],
    workflows: input.workflows ?? [],
    indexes: [],
    reports: [],
    capabilities: [
      "timeline",
      "notes",
      "documents",
      "tags",
      "relationships",
      "search",
      "ownership",
      "permissions",
    ],
    intelligence: input.intelligence,
    metadata: { application: APP, phase: "domain-completion" },
  };
}

export const f = {
  text: (key: string, label: string, required = false) => ({
    key,
    type: "text" as const,
    label,
    required,
    searchable: true,
    filterable: true,
  }),
  email: (key: string, label: string, required = false) => ({
    key,
    type: "email" as const,
    label,
    required,
    searchable: true,
  }),
  phone: (key: string, label: string) => ({
    key,
    type: "phone" as const,
    label,
  }),
  date: (key: string, label: string, required = false) => ({
    key,
    type: "date" as const,
    label,
    required,
    sortable: true,
  }),
  number: (key: string, label: string, required = false) => ({
    key,
    type: "number" as const,
    label,
    required,
    sortable: true,
  }),
  currency: (key: string, label: string, required = false) => ({
    key,
    type: "currency" as const,
    label,
    required,
    sortable: true,
  }),
  select: (key: string, label: string, required = false) => ({
    key,
    type: "select" as const,
    label,
    required,
    filterable: true,
  }),
  bool: (key: string, label: string) => ({
    key,
    type: "boolean" as const,
    label,
    filterable: true,
  }),
  ref: (key: string, label: string, entityType: string, required = false) => ({
    key,
    type: "entity_reference" as const,
    label,
    entityType,
    required,
    filterable: true,
  }),
  rich: (key: string, label: string) => ({
    key,
    type: "rich_text" as const,
    label,
  }),
};

export type AcademySchemaAction =
  | "read"
  | "create"
  | "update"
  | "approve"
  | "archive"
  | "export"
  | "administer";

export function perms(prefix: string, actions: AcademySchemaAction[]) {
  return actions.map((action) => ({
    action,
    permission: `academyos.${prefix}.${action}`,
  }));
}
