import type { PlatformSchema } from "@/lib/platform/schema/types";

const registry = new Map<string, PlatformSchema>();

export function resetSchemaRegistryForTests(): void {
  registry.clear();
}

export function putSchema(definition: PlatformSchema): PlatformSchema {
  const normalized: PlatformSchema = {
    ...definition,
    id: definition.id.trim(),
    entityType: definition.entityType.trim(),
    fields: definition.fields.map((f) => ({
      ...f,
      constraints: f.constraints ? { ...f.constraints } : undefined,
      metadata: { ...(f.metadata ?? {}) },
    })),
    relationships: definition.relationships.map((r) => ({
      ...r,
      metadata: { ...(r.metadata ?? {}) },
    })),
    permissions: definition.permissions.map((p) => ({ ...p })),
    forms: definition.forms.map((f) => ({
      ...f,
      fieldKeys: f.fieldKeys ? [...f.fieldKeys] : undefined,
    })),
    workflows: definition.workflows.map((w) => ({ ...w })),
    indexes: definition.indexes.map((i) => ({
      ...i,
      fields: [...i.fields],
    })),
    reports: definition.reports.map((r) => ({
      ...r,
      fields: [...r.fields],
    })),
    capabilities: definition.capabilities ? [...definition.capabilities] : undefined,
    intelligence: definition.intelligence
      ? {
          forecastableFields: definition.intelligence.forecastableFields
            ? [...definition.intelligence.forecastableFields]
            : undefined,
          reportableFields: definition.intelligence.reportableFields
            ? [...definition.intelligence.reportableFields]
            : undefined,
          searchableFields: definition.intelligence.searchableFields
            ? [...definition.intelligence.searchableFields]
            : undefined,
        }
      : undefined,
    metadata: { ...definition.metadata },
    extensions: definition.extensions
      ? { ...definition.extensions }
      : undefined,
  };
  registry.set(normalized.id, normalized);
  return normalized;
}

export function removeSchema(schemaId: string): boolean {
  return registry.delete(schemaId);
}

export function getRegisteredSchema(schemaId: string): PlatformSchema | null {
  return registry.get(schemaId) ?? null;
}

export function listRegisteredSchemas(filter?: {
  applicationId?: string | null;
  organizationId?: string | null;
  entityType?: string | null;
  layer?: PlatformSchema["layer"];
}): PlatformSchema[] {
  let rows = [...registry.values()];
  if (filter?.applicationId !== undefined) {
    rows = rows.filter(
      (s) =>
        s.applicationId === filter.applicationId || s.applicationId == null
    );
  }
  if (filter?.organizationId !== undefined) {
    rows = rows.filter((s) => s.organizationId === filter.organizationId);
  }
  if (filter?.entityType !== undefined) {
    rows = rows.filter((s) => s.entityType === filter.entityType);
  }
  if (filter?.layer !== undefined) {
    rows = rows.filter((s) => s.layer === filter.layer);
  }
  return rows.sort((a, b) => a.id.localeCompare(b.id));
}

export function assertSchemaRegistered(schemaId: string): PlatformSchema {
  const def = getRegisteredSchema(schemaId);
  if (!def) {
    throw new Error(
      `Schema "${schemaId}" is not registered. Applications must SchemaService.register().`
    );
  }
  return def;
}

export const SchemaRegistry = {
  put: putSchema,
  remove: removeSchema,
  get: getRegisteredSchema,
  list: listRegisteredSchemas,
  assert: assertSchemaRegistered,
  resetForTests: resetSchemaRegistryForTests,
} as const;
