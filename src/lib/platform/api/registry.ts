import type { ApiHandler, HttpMethod, PlatformEndpoint } from "@/lib/platform/api/types";

const registry = new Map<string, PlatformEndpoint>();
const handlers = new Map<string, ApiHandler>();

export function resetApiRegistryForTests(): void {
  registry.clear();
  handlers.clear();
}

export function putEndpoint(definition: PlatformEndpoint): PlatformEndpoint {
  const normalized: PlatformEndpoint = {
    ...definition,
    id: definition.id.trim(),
    path: normalizePath(definition.path),
    method: definition.method.toUpperCase() as HttpMethod,
    permissions: definition.permissions.map((p) => ({ ...p })),
    tags: definition.tags ? [...definition.tags] : undefined,
    requestSchema: definition.requestSchema
      ? {
          schemaId: definition.requestSchema.schemaId,
          fieldKeys: definition.requestSchema.fieldKeys
            ? [...definition.requestSchema.fieldKeys]
            : undefined,
        }
      : null,
    responseSchema: definition.responseSchema
      ? {
          schemaId: definition.responseSchema.schemaId,
          fieldKeys: definition.responseSchema.fieldKeys
            ? [...definition.responseSchema.fieldKeys]
            : undefined,
        }
      : null,
    metadata: { ...definition.metadata },
  };
  registry.set(normalized.id, normalized);
  return normalized;
}

export function removeEndpoint(endpointId: string): boolean {
  handlers.delete(endpointId);
  return registry.delete(endpointId);
}

export function getEndpoint(endpointId: string): PlatformEndpoint | null {
  return registry.get(endpointId) ?? null;
}

export function listEndpoints(filter?: {
  applicationId?: string | null;
  entityType?: string | null;
  method?: HttpMethod;
  version?: string;
  includeDeprecated?: boolean;
}): PlatformEndpoint[] {
  let rows = [...registry.values()];
  if (filter?.applicationId !== undefined) {
    rows = rows.filter(
      (e) =>
        e.applicationId === filter.applicationId || e.applicationId == null
    );
  }
  if (filter?.entityType !== undefined) {
    rows = rows.filter((e) => e.entityType === filter.entityType);
  }
  if (filter?.method) {
    rows = rows.filter((e) => e.method === filter.method);
  }
  if (filter?.version) {
    rows = rows.filter((e) => e.version === filter.version);
  }
  if (filter?.includeDeprecated === false) {
    rows = rows.filter((e) => !e.deprecated);
  }
  return rows.sort((a, b) => {
    const pathCmp = a.path.localeCompare(b.path);
    if (pathCmp !== 0) return pathCmp;
    return a.method.localeCompare(b.method);
  });
}

export function assertEndpointRegistered(endpointId: string): PlatformEndpoint {
  const def = getEndpoint(endpointId);
  if (!def) {
    throw new Error(
      `Endpoint "${endpointId}" is not registered. Applications must ApiService.register().`
    );
  }
  return def;
}

export function setEndpointHandler(
  endpointId: string,
  handler: ApiHandler
): void {
  assertEndpointRegistered(endpointId);
  handlers.set(endpointId, handler);
}

export function getEndpointHandler(endpointId: string): ApiHandler | null {
  return handlers.get(endpointId) ?? null;
}

export function removeEndpointHandler(endpointId: string): boolean {
  return handlers.delete(endpointId);
}

function normalizePath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed.startsWith("/")) {
    return `/${trimmed}`;
  }
  return trimmed.replace(/\/+$/, "") || "/";
}

export const ApiRegistry = {
  put: putEndpoint,
  remove: removeEndpoint,
  get: getEndpoint,
  list: listEndpoints,
  assert: assertEndpointRegistered,
  setHandler: setEndpointHandler,
  getHandler: getEndpointHandler,
  removeHandler: removeEndpointHandler,
  resetForTests: resetApiRegistryForTests,
} as const;
