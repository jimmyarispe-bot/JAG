import type { PlatformEndpoint } from "@/lib/platform/api/types";

export type VersionStatus = {
  version: string;
  deprecated: boolean;
  deprecatedAt: string | null;
  sunsetAt: string | null;
  compatibilityNotes: string | null;
  replacedBy: string | null;
  active: boolean;
};

/**
 * Read version metadata from an endpoint.
 * Does not implement breaking-change migration logic.
 */
export function getVersionStatus(endpoint: PlatformEndpoint): VersionStatus {
  const deprecated = Boolean(endpoint.deprecated);
  return {
    version: endpoint.version,
    deprecated,
    deprecatedAt: endpoint.deprecatedAt ?? null,
    sunsetAt: endpoint.sunsetAt ?? null,
    compatibilityNotes: endpoint.compatibilityNotes ?? null,
    replacedBy: endpoint.replacedBy ?? null,
    active: !deprecated,
  };
}

export function isDeprecated(endpoint: PlatformEndpoint): boolean {
  return Boolean(endpoint.deprecated);
}

export function deprecationHeaders(
  endpoint: PlatformEndpoint
): Record<string, string> {
  if (!endpoint.deprecated) return {};
  const headers: Record<string, string> = {
    Deprecation: "true",
  };
  if (endpoint.sunsetAt) {
    headers.Sunset = endpoint.sunsetAt;
  }
  if (endpoint.replacedBy) {
    headers["X-API-Replaced-By"] = endpoint.replacedBy;
  }
  if (endpoint.compatibilityNotes) {
    headers["X-API-Compatibility-Notes"] = endpoint.compatibilityNotes;
  }
  return headers;
}

export function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map((p) => Number.parseInt(p, 10) || 0);
  const pb = b.split(".").map((p) => Number.parseInt(p, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d < 0 ? -1 : 1;
  }
  return 0;
}

export function pickActiveVersion(
  endpoints: PlatformEndpoint[]
): PlatformEndpoint | null {
  const active = endpoints.filter((e) => !e.deprecated);
  if (!active.length) return null;
  return [...active].sort((x, y) => compareVersions(y.version, x.version))[0] ?? null;
}
