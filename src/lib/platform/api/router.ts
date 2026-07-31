import { listEndpoints } from "@/lib/platform/api/registry";
import type { HttpMethod, PlatformEndpoint } from "@/lib/platform/api/types";

export type RouteMatch = {
  endpoint: PlatformEndpoint;
  params: Record<string, string>;
};

function normalizeRequestPath(path: string): string {
  const noQuery = path.split("?")[0] ?? path;
  const trimmed = noQuery.trim();
  const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withSlash.replace(/\/+$/, "") || "/";
}

/**
 * Compile `/api/v1/cases/:id` → regex + param names.
 */
export function compilePathPattern(path: string): {
  regex: RegExp;
  paramNames: string[];
} {
  const paramNames: string[] = [];
  const parts = normalizeRequestPath(path).split("/").map((segment) => {
    if (segment.startsWith(":") && segment.length > 1) {
      paramNames.push(segment.slice(1));
      return "([^/]+)";
    }
    return segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  });
  return {
    regex: new RegExp(`^${parts.join("/")}$`),
    paramNames,
  };
}

export function matchPath(
  pattern: string,
  requestPath: string
): Record<string, string> | null {
  const { regex, paramNames } = compilePathPattern(pattern);
  const normalized = normalizeRequestPath(requestPath);
  const match = regex.exec(normalized);
  if (!match) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < paramNames.length; i++) {
    const name = paramNames[i]!;
    params[name] = decodeURIComponent(match[i + 1] ?? "");
  }
  return params;
}

/**
 * Find a registered endpoint for method + path.
 * Prefers non-deprecated matches; among equals, highest version wins.
 */
export function matchRoute(
  method: HttpMethod,
  path: string
): RouteMatch | null {
  const upper = method.toUpperCase() as HttpMethod;
  const candidates: RouteMatch[] = [];

  for (const endpoint of listEndpoints({ method: upper })) {
    const params = matchPath(endpoint.path, path);
    if (params) {
      candidates.push({ endpoint, params });
    }
  }

  if (!candidates.length) return null;

  candidates.sort((a, b) => {
    if (a.endpoint.deprecated !== b.endpoint.deprecated) {
      return a.endpoint.deprecated ? 1 : -1;
    }
    const va = a.endpoint.version.split(".").map((p) => Number.parseInt(p, 10) || 0);
    const vb = b.endpoint.version.split(".").map((p) => Number.parseInt(p, 10) || 0);
    for (let i = 0; i < Math.max(va.length, vb.length); i++) {
      const d = (vb[i] ?? 0) - (va[i] ?? 0);
      if (d !== 0) return d;
    }
    return a.endpoint.id.localeCompare(b.endpoint.id);
  });

  return candidates[0] ?? null;
}

export function listRoutesForPath(path: string): PlatformEndpoint[] {
  return listEndpoints().filter((e) => matchPath(e.path, path) !== null);
}
