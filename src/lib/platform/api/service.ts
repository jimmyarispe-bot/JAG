import {
  answerDiscovery,
  describeEndpoint,
  discoverEndpoint,
  discoverEndpoints,
} from "@/lib/platform/api/discovery";
import { generateApiDocumentation } from "@/lib/platform/api/documentation";
import {
  assertValidEndpoint,
  endpointKey,
  normalizeEndpoint,
} from "@/lib/platform/api/endpoint";
import {
  assertEndpointAllowed,
  canInvokeEndpoint,
  listEndpointPermissions,
  resolveEndpointPermission,
} from "@/lib/platform/api/permissions";
import {
  ApiRegistry,
  assertEndpointRegistered,
  getEndpoint,
  getEndpointHandler,
  listEndpoints,
  putEndpoint,
  removeEndpoint,
  removeEndpointHandler,
  resetApiRegistryForTests,
  setEndpointHandler,
} from "@/lib/platform/api/registry";
import { createApiRequest, readQueryParam } from "@/lib/platform/api/request";
import {
  errorResponse,
  forbiddenResponse,
  isErrorBody,
  notFoundResponse,
  okResponse,
  responseHeaders,
  validationFailedResponse,
} from "@/lib/platform/api/response";
import { listRoutesForPath, matchRoute } from "@/lib/platform/api/router";
import {
  validateEndpointDefinition,
  validateRequestAgainstSchema,
} from "@/lib/platform/api/validation";
import {
  compareVersions,
  deprecationHeaders,
  getVersionStatus,
  isDeprecated,
  pickActiveVersion,
} from "@/lib/platform/api/versioning";
import type {
  ApiDispatchResult,
  ApiHandler,
  ApiRegisterOptions,
  ApiRequestContext,
  PlatformEndpoint,
} from "@/lib/platform/api/types";

export function resetApiFrameworkForTests(): void {
  resetApiRegistryForTests();
}

/**
 * Universal API Framework service.
 * Applications register endpoints; platform validates, authorizes, and dispatches.
 * Platform ships with zero endpoints.
 */
export const ApiService = {
  registry: ApiRegistry,

  register(
    definition: PlatformEndpoint,
    options?: ApiRegisterOptions
  ): PlatformEndpoint {
    const normalized = normalizeEndpoint(definition);
    if (!options?.skipValidation) {
      assertValidEndpoint(normalized);
    }
    const stored = putEndpoint(normalized);
    if (options?.handler) {
      setEndpointHandler(stored.id, options.handler);
    }
    return stored;
  },

  unregister(endpointId: string): boolean {
    return removeEndpoint(endpointId);
  },

  get: getEndpoint,
  list: listEndpoints,
  assertRegistered: assertEndpointRegistered,
  key: endpointKey,

  setHandler: setEndpointHandler,
  getHandler: getEndpointHandler,
  removeHandler: removeEndpointHandler,

  validateDefinition: validateEndpointDefinition,
  validateRequest: validateRequestAgainstSchema,
  normalize: normalizeEndpoint,

  // Routing
  match: matchRoute,
  routesForPath: listRoutesForPath,

  // Permissions (IAM)
  resolvePermission: resolveEndpointPermission,
  listPermissions: listEndpointPermissions,
  canInvoke: canInvokeEndpoint,
  assertAllowed: assertEndpointAllowed,

  // Versioning
  versionStatus: getVersionStatus,
  isDeprecated,
  deprecationHeaders,
  compareVersions,
  pickActiveVersion,

  // Discovery
  discover: discoverEndpoints,
  discoverOne: discoverEndpoint,
  answerDiscovery,
  describe: describeEndpoint,

  // Documentation
  document: generateApiDocumentation,

  // Request helpers
  createRequest: createApiRequest,
  readQueryParam,

  // Response helpers
  ok: okResponse,
  error: errorResponse,
  notFound: notFoundResponse,
  forbidden: forbiddenResponse,
  validationFailed: validationFailedResponse,
  responseHeaders,
  isErrorBody,

  /**
   * Match → authorize → validate → handler.
   * Does not replace Next.js routes; applications may call this from a thin adapter.
   */
  async dispatch(request: ApiRequestContext): Promise<ApiDispatchResult> {
    const match = matchRoute(request.method, request.path);
    if (!match) {
      return { ...notFoundResponse(request.path, request.method), matched: false };
    }

    const { endpoint, params } = match;
    const ctx: ApiRequestContext = {
      ...request,
      params: { ...params, ...(request.params ?? {}) },
      action: request.action ?? "invoke",
    };

    if (
      !canInvokeEndpoint({
        endpoint,
        action: ctx.action,
        grantedPermissions: ctx.grantedPermissions,
      })
    ) {
      const permission =
        resolveEndpointPermission(endpoint, ctx.action ?? "invoke") ??
        "unknown";
      return { ...forbiddenResponse(endpoint, permission), matched: true };
    }

    const validation = validateRequestAgainstSchema(endpoint, ctx.body);
    if (!validation.valid) {
      return {
        ...validationFailedResponse(endpoint, validation.issues),
        matched: true,
      };
    }

    const handler = getEndpointHandler(endpoint.id);
    if (!handler) {
      return {
        ...errorResponse(
          501,
          "handler_not_implemented",
          `No handler registered for endpoint ${endpoint.id}`,
          { endpoint }
        ),
        matched: true,
      };
    }

    try {
      const data = await handler(ctx, endpoint);
      return { ...okResponse(data, endpoint), matched: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Handler failed";
      return {
        ...errorResponse(500, "handler_error", message, { endpoint }),
        matched: true,
      };
    }
  },

  resetForTests: resetApiFrameworkForTests,
} as const;

export type ApiServiceApi = typeof ApiService;

// Re-export handler type for register convenience
export type { ApiHandler };
