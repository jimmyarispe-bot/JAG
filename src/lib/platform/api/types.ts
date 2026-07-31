/**
 * Universal API Framework (Sprint 075).
 * Applications register endpoints; platform owns validation, permissions,
 * versioning, discovery, and documentation. Platform ships zero endpoints.
 */

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD";

/** Reference a Universal Schema Registry schema instead of redefining payloads. */
export type ApiSchemaRef = {
  schemaId: string;
  /** Optional subset of schema field keys; omit = all fields. */
  fieldKeys?: string[];
};

export type ApiPermissionRule = {
  /** Logical action on the endpoint (default invoke). */
  action: "invoke" | "read" | "write" | string;
  /** IAM permission key evaluated against granted permissions. */
  permission: string;
};

export type ApiVersionMeta = {
  version: string;
  deprecated?: boolean;
  deprecatedAt?: string | null;
  sunsetAt?: string | null;
  compatibilityNotes?: string | null;
  /** Endpoint id that supersedes this one. */
  replacedBy?: string | null;
};

/**
 * Application-registered endpoint contract.
 * No AcademyOS / HealthcareOS / ManufacturingOS built-ins.
 */
export type PlatformEndpoint = {
  id: string;
  applicationId: string | null;
  entityType: string | null;
  method: HttpMethod;
  /** Path template, e.g. `/api/v1/cases/:id`. */
  path: string;
  requestSchema: ApiSchemaRef | null;
  responseSchema: ApiSchemaRef | null;
  permissions: ApiPermissionRule[];
  version: string;
  deprecated?: boolean;
  deprecatedAt?: string | null;
  sunsetAt?: string | null;
  compatibilityNotes?: string | null;
  replacedBy?: string | null;
  summary?: string | null;
  description?: string | null;
  tags?: string[];
  metadata: Record<string, unknown>;
};

export type ApiRequestContext = {
  method: HttpMethod;
  path: string;
  /** Path params extracted by the router (`:id` → params.id). */
  params?: Record<string, string>;
  query?: Record<string, string | string[] | undefined>;
  body?: unknown;
  headers?: Record<string, string | undefined>;
  grantedPermissions?: ReadonlySet<string> | readonly string[];
  actorUserId?: string | null;
  organizationId?: string | null;
  /** Permission action to enforce (default invoke). */
  action?: string;
};

export type ApiValidationIssue = {
  path: string;
  code: string;
  message: string;
};

export type ApiValidationResult = {
  valid: boolean;
  issues: ApiValidationIssue[];
};

export type ApiErrorBody = {
  error: string;
  code: string;
  issues?: ApiValidationIssue[];
  meta?: Record<string, unknown>;
};

export type ApiSuccessBody<T = unknown> = {
  data: T;
  meta?: Record<string, unknown>;
};

export type PlatformApiResponse<T = unknown> = {
  status: number;
  body: ApiSuccessBody<T> | ApiErrorBody;
  endpointId: string | null;
  deprecated: boolean;
};

export type ApiHandler = (
  request: ApiRequestContext,
  endpoint: PlatformEndpoint
) => Promise<unknown> | unknown;

export type ApiDiscoveryItem = {
  id: string;
  applicationId: string | null;
  entityType: string | null;
  method: HttpMethod;
  path: string;
  version: string;
  deprecated: boolean;
  permissions: ApiPermissionRule[];
  requestSchemaId: string | null;
  responseSchemaId: string | null;
  tags: string[];
};

export type ApiDocumentation = {
  title: string;
  generatedAt: string;
  endpointCount: number;
  markdown: string;
  endpoints: Array<{
    id: string;
    method: HttpMethod;
    path: string;
    version: string;
    deprecated: boolean;
    summary: string | null;
    permissions: string[];
    requestSchemaId: string | null;
    responseSchemaId: string | null;
    requestFields: string[];
    responseFields: string[];
    compatibilityNotes: string | null;
  }>;
};

export type ApiRegisterOptions = {
  skipValidation?: boolean;
  /** Optional dispatch handler bound at registration time. */
  handler?: ApiHandler;
};

export type ApiDispatchResult<T = unknown> = PlatformApiResponse<T> & {
  matched: boolean;
};
