import type { EntityTypeDefinition } from "@/lib/platform/entities/types";

const registry = new Map<string, EntityTypeDefinition>();

export function resetEntityRegistryForTests(): void {
  registry.clear();
}

/**
 * Register an application entity type.
 * Platform code never hardcodes domain entities — applications call this.
 */
export function registerEntityType(definition: EntityTypeDefinition): EntityTypeDefinition {
  if (!definition.entityType.trim()) {
    throw new Error("entityType is required");
  }
  const key = definition.entityType.trim();
  const normalized: EntityTypeDefinition = {
    ...definition,
    entityType: key,
    capabilities: [...definition.capabilities],
    searchable: {
      fields: [...definition.searchable.fields],
      defaultSort: definition.searchable.defaultSort
        ? { ...definition.searchable.defaultSort }
        : undefined,
    },
    permissions: definition.permissions.map((p) => ({ ...p })),
    metadataKeys: definition.metadataKeys ? [...definition.metadataKeys] : undefined,
  };
  registry.set(key, normalized);
  return normalized;
}

export function unregisterEntityType(entityType: string): boolean {
  return registry.delete(entityType);
}

export function getEntityType(entityType: string): EntityTypeDefinition | null {
  return registry.get(entityType) ?? null;
}

export function listEntityTypes(applicationId?: string | null): EntityTypeDefinition[] {
  const all = [...registry.values()].sort((a, b) =>
    a.entityType.localeCompare(b.entityType)
  );
  if (applicationId === undefined) return all;
  return all.filter(
    (d) => d.applicationId === applicationId || d.applicationId == null
  );
}

export function isEntityTypeRegistered(entityType: string): boolean {
  return registry.has(entityType);
}

export function assertEntityTypeRegistered(entityType: string): EntityTypeDefinition {
  const def = getEntityType(entityType);
  if (!def) {
    throw new Error(
      `Entity type "${entityType}" is not registered. Applications must registerEntityType() before use.`
    );
  }
  return def;
}

export function entityHasCapability(
  entityType: string,
  capability: EntityTypeDefinition["capabilities"][number]
): boolean {
  const def = getEntityType(entityType);
  return Boolean(def?.capabilities.includes(capability));
}
