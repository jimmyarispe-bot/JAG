import type { PlatformEndpoint } from "@/lib/platform/api/types";
import { validateEndpointDefinition } from "@/lib/platform/api/validation";

const HTTP_METHODS = new Set([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
]);

/**
 * Normalize an endpoint definition before registration.
 */
export function normalizeEndpoint(
  definition: PlatformEndpoint
): PlatformEndpoint {
  if (!definition.id?.trim()) {
    throw new Error("PlatformEndpoint.id is required");
  }
  if (!definition.path?.trim()) {
    throw new Error("PlatformEndpoint.path is required");
  }
  if (!definition.method || !HTTP_METHODS.has(definition.method.toUpperCase())) {
    throw new Error(
      `PlatformEndpoint.method must be one of ${[...HTTP_METHODS].join(", ")}`
    );
  }
  if (!definition.version?.trim()) {
    throw new Error("PlatformEndpoint.version is required");
  }

  const path = definition.path.trim();
  const withSlash = path.startsWith("/") ? path : `/${path}`;
  const normalizedPath = withSlash.replace(/\/+$/, "") || "/";

  return {
    ...definition,
    id: definition.id.trim(),
    path: normalizedPath,
    method: definition.method.toUpperCase() as PlatformEndpoint["method"],
    version: definition.version.trim(),
    permissions: definition.permissions ?? [],
    metadata: definition.metadata ?? {},
    deprecated: Boolean(definition.deprecated),
  };
}

export function assertValidEndpoint(definition: PlatformEndpoint): void {
  const result = validateEndpointDefinition(definition);
  if (!result.valid) {
    const detail = result.issues
      .map((i) => `${i.code}: ${i.message}`)
      .join("; ");
    throw new Error(`Endpoint validation failed: ${detail}`);
  }
}

export function endpointKey(endpoint: PlatformEndpoint): string {
  return `${endpoint.method} ${endpoint.path}`;
}
