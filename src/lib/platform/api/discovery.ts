import { getEndpoint, listEndpoints } from "@/lib/platform/api/registry";
import { getVersionStatus } from "@/lib/platform/api/versioning";
import type {
  ApiDiscoveryItem,
  HttpMethod,
  PlatformEndpoint,
} from "@/lib/platform/api/types";

function toDiscoveryItem(endpoint: PlatformEndpoint): ApiDiscoveryItem {
  return {
    id: endpoint.id,
    applicationId: endpoint.applicationId,
    entityType: endpoint.entityType,
    method: endpoint.method,
    path: endpoint.path,
    version: endpoint.version,
    deprecated: Boolean(endpoint.deprecated),
    permissions: endpoint.permissions.map((p) => ({ ...p })),
    requestSchemaId: endpoint.requestSchema?.schemaId ?? null,
    responseSchemaId: endpoint.responseSchema?.schemaId ?? null,
    tags: endpoint.tags ? [...endpoint.tags] : [],
  };
}

/**
 * Runtime discovery — answer what endpoints exist and how they are protected.
 */
export function discoverEndpoints(filter?: {
  applicationId?: string | null;
  entityType?: string | null;
  method?: HttpMethod;
  version?: string;
  includeDeprecated?: boolean;
}): ApiDiscoveryItem[] {
  return listEndpoints(filter).map(toDiscoveryItem);
}

export function discoverEndpoint(endpointId: string): ApiDiscoveryItem | null {
  const endpoint = getEndpoint(endpointId);
  return endpoint ? toDiscoveryItem(endpoint) : null;
}

export type ApiDiscoveryAnswer = {
  endpoints: ApiDiscoveryItem[];
  byApplication: Record<string, string[]>;
  schemasUsed: string[];
  permissionsUsed: string[];
  versions: string[];
};

/**
 * Aggregate discovery answers for platform tooling.
 */
export function answerDiscovery(filter?: {
  applicationId?: string | null;
  includeDeprecated?: boolean;
}): ApiDiscoveryAnswer {
  const endpoints = discoverEndpoints(filter);
  const byApplication: Record<string, string[]> = {};
  const schemas = new Set<string>();
  const permissions = new Set<string>();
  const versions = new Set<string>();

  for (const ep of endpoints) {
    const appKey = ep.applicationId ?? "(platform)";
    byApplication[appKey] = byApplication[appKey] ?? [];
    byApplication[appKey]!.push(ep.id);
    if (ep.requestSchemaId) schemas.add(ep.requestSchemaId);
    if (ep.responseSchemaId) schemas.add(ep.responseSchemaId);
    for (const p of ep.permissions) permissions.add(p.permission);
    versions.add(ep.version);
  }

  return {
    endpoints,
    byApplication,
    schemasUsed: [...schemas].sort(),
    permissionsUsed: [...permissions].sort(),
    versions: [...versions].sort(),
  };
}

export function describeEndpoint(endpointId: string): {
  discovery: ApiDiscoveryItem;
  version: ReturnType<typeof getVersionStatus>;
} | null {
  const endpoint = getEndpoint(endpointId);
  if (!endpoint) return null;
  return {
    discovery: toDiscoveryItem(endpoint),
    version: getVersionStatus(endpoint),
  };
}
