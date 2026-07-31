import { deprecationHeaders } from "@/lib/platform/api/versioning";
import type {
  ApiErrorBody,
  ApiSuccessBody,
  ApiValidationIssue,
  PlatformApiResponse,
  PlatformEndpoint,
} from "@/lib/platform/api/types";

export function okResponse<T>(
  data: T,
  endpoint: PlatformEndpoint | null,
  meta?: Record<string, unknown>
): PlatformApiResponse<T> {
  const body: ApiSuccessBody<T> = {
    data,
    meta: {
      ...(meta ?? {}),
      ...(endpoint
        ? {
            endpointId: endpoint.id,
            version: endpoint.version,
            deprecated: Boolean(endpoint.deprecated),
          }
        : {}),
    },
  };
  return {
    status: 200,
    body,
    endpointId: endpoint?.id ?? null,
    deprecated: Boolean(endpoint?.deprecated),
  };
}

export function errorResponse(
  status: number,
  code: string,
  error: string,
  options?: {
    endpoint?: PlatformEndpoint | null;
    issues?: ApiValidationIssue[];
    meta?: Record<string, unknown>;
  }
): PlatformApiResponse {
  const body: ApiErrorBody = {
    error,
    code,
    issues: options?.issues,
    meta: {
      ...(options?.meta ?? {}),
      ...(options?.endpoint
        ? {
            endpointId: options.endpoint.id,
            version: options.endpoint.version,
          }
        : {}),
    },
  };
  return {
    status,
    body,
    endpointId: options?.endpoint?.id ?? null,
    deprecated: Boolean(options?.endpoint?.deprecated),
  };
}

export function notFoundResponse(path: string, method: string): PlatformApiResponse {
  return errorResponse(404, "not_found", `No endpoint for ${method} ${path}`);
}

export function forbiddenResponse(
  endpoint: PlatformEndpoint,
  permission: string
): PlatformApiResponse {
  return errorResponse(403, "forbidden", `Permission denied: requires ${permission}`, {
    endpoint,
  });
}

export function validationFailedResponse(
  endpoint: PlatformEndpoint,
  issues: ApiValidationIssue[]
): PlatformApiResponse {
  return errorResponse(400, "validation_failed", "Request validation failed", {
    endpoint,
    issues,
  });
}

export function responseHeaders(endpoint: PlatformEndpoint): Record<string, string> {
  return {
    "X-API-Endpoint": endpoint.id,
    "X-API-Version": endpoint.version,
    ...deprecationHeaders(endpoint),
  };
}

export function isErrorBody(
  body: PlatformApiResponse["body"]
): body is ApiErrorBody {
  return "error" in body && "code" in body;
}
