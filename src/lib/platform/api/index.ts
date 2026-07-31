export {
  ApiService,
  resetApiFrameworkForTests,
} from "@/lib/platform/api/service";
export type { ApiServiceApi, ApiHandler } from "@/lib/platform/api/service";

export {
  ApiRegistry,
  putEndpoint,
  removeEndpoint,
  getEndpoint,
  listEndpoints,
  assertEndpointRegistered,
  setEndpointHandler,
  getEndpointHandler,
  resetApiRegistryForTests,
} from "@/lib/platform/api/registry";

export {
  normalizeEndpoint,
  assertValidEndpoint,
  endpointKey,
} from "@/lib/platform/api/endpoint";

export {
  matchRoute,
  matchPath,
  compilePathPattern,
  listRoutesForPath,
} from "@/lib/platform/api/router";
export type { RouteMatch } from "@/lib/platform/api/router";

export { createApiRequest, readQueryParam, requestBodyAsRecord } from "@/lib/platform/api/request";

export {
  okResponse,
  errorResponse,
  notFoundResponse,
  forbiddenResponse,
  validationFailedResponse,
  responseHeaders,
  isErrorBody,
} from "@/lib/platform/api/response";

export {
  validateEndpointDefinition,
  validateRequestAgainstSchema,
} from "@/lib/platform/api/validation";

export {
  resolveEndpointPermission,
  listEndpointPermissions,
  canInvokeEndpoint,
  assertEndpointAllowed,
} from "@/lib/platform/api/permissions";

export {
  getVersionStatus,
  isDeprecated,
  deprecationHeaders,
  compareVersions,
  pickActiveVersion,
} from "@/lib/platform/api/versioning";
export type { VersionStatus } from "@/lib/platform/api/versioning";

export {
  discoverEndpoints,
  discoverEndpoint,
  answerDiscovery,
  describeEndpoint,
} from "@/lib/platform/api/discovery";
export type { ApiDiscoveryAnswer } from "@/lib/platform/api/discovery";

export { generateApiDocumentation } from "@/lib/platform/api/documentation";

export type {
  ApiDiscoveryItem,
  ApiDocumentation,
  ApiDispatchResult,
  ApiErrorBody,
  ApiPermissionRule,
  ApiRegisterOptions,
  ApiRequestContext,
  ApiSchemaRef,
  ApiSuccessBody,
  ApiValidationIssue,
  ApiValidationResult,
  ApiVersionMeta,
  HttpMethod,
  PlatformApiResponse,
  PlatformEndpoint,
} from "@/lib/platform/api/types";
