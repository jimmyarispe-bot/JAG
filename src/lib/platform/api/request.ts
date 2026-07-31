import type { ApiRequestContext, HttpMethod } from "@/lib/platform/api/types";

export function createApiRequest(
  partial: Omit<ApiRequestContext, "method" | "path"> & {
    method: HttpMethod | string;
    path: string;
  }
): ApiRequestContext {
  return {
    method: partial.method.toUpperCase() as HttpMethod,
    path: partial.path,
    params: partial.params ?? {},
    query: partial.query ?? {},
    body: partial.body,
    headers: partial.headers ?? {},
    grantedPermissions: partial.grantedPermissions,
    actorUserId: partial.actorUserId ?? null,
    organizationId: partial.organizationId ?? null,
    action: partial.action ?? "invoke",
  };
}

export function readQueryParam(
  request: ApiRequestContext,
  key: string
): string | null {
  const value = request.query?.[key];
  if (value === undefined) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export function requestBodyAsRecord(
  body: unknown
): Record<string, unknown> | null {
  if (body == null) return null;
  if (typeof body !== "object" || Array.isArray(body)) return null;
  return body as Record<string, unknown>;
}
