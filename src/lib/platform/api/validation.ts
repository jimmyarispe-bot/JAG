import { listEndpoints } from "@/lib/platform/api/registry";
import { requestBodyAsRecord } from "@/lib/platform/api/request";
import type {
  ApiSchemaRef,
  ApiValidationIssue,
  ApiValidationResult,
  PlatformEndpoint,
} from "@/lib/platform/api/types";
import { getRegisteredSchema } from "@/lib/platform/schema/registry";
import { resolveSchema } from "@/lib/platform/schema/extensions";

function validateSchemaRef(
  ref: ApiSchemaRef | null,
  path: string
): ApiValidationIssue[] {
  if (!ref) return [];
  const issues: ApiValidationIssue[] = [];
  if (!ref.schemaId?.trim()) {
    issues.push({
      path,
      code: "missing_schema_id",
      message: "schemaId is required when schema ref is set",
    });
    return issues;
  }
  const schema = getRegisteredSchema(ref.schemaId);
  if (!schema) {
    issues.push({
      path,
      code: "unknown_schema",
      message: `Schema "${ref.schemaId}" is not registered`,
    });
    return issues;
  }
  if (ref.fieldKeys?.length) {
    const resolved = resolveSchema(ref.schemaId);
    const keys = new Set(resolved.fields.map((f) => f.key));
    for (const key of ref.fieldKeys) {
      if (!keys.has(key)) {
        issues.push({
          path: `${path}.fieldKeys`,
          code: "unknown_schema_field",
          message: `Schema "${ref.schemaId}" has no field "${key}"`,
        });
      }
    }
  }
  return issues;
}

/**
 * Validate endpoint registration shape + schema linkage.
 */
export function validateEndpointDefinition(
  endpoint: PlatformEndpoint
): ApiValidationResult {
  const issues: ApiValidationIssue[] = [];

  if (!endpoint.id?.trim()) {
    issues.push({ path: "id", code: "required", message: "id is required" });
  }
  if (!endpoint.path?.trim()) {
    issues.push({ path: "path", code: "required", message: "path is required" });
  } else if (!endpoint.path.includes("/")) {
    issues.push({
      path: "path",
      code: "invalid_path",
      message: "path must be a URL path",
    });
  }
  if (!endpoint.version?.trim()) {
    issues.push({
      path: "version",
      code: "required",
      message: "version is required",
    });
  }

  for (const rule of endpoint.permissions) {
    if (!rule.action?.trim() || !rule.permission?.trim()) {
      issues.push({
        path: "permissions",
        code: "invalid_permission",
        message: "Permission rules require action and permission",
      });
    }
  }

  issues.push(...validateSchemaRef(endpoint.requestSchema, "requestSchema"));
  issues.push(...validateSchemaRef(endpoint.responseSchema, "responseSchema"));

  if (endpoint.replacedBy) {
    const replacement = listEndpoints().find((e) => e.id === endpoint.replacedBy);
    // Allow forward refs at register time if not yet present — only warn when self-ref
    if (endpoint.replacedBy === endpoint.id) {
      issues.push({
        path: "replacedBy",
        code: "invalid_replaced_by",
        message: "replacedBy cannot reference the same endpoint",
      });
    }
    void replacement;
  }

  // Duplicate method+path+version
  const conflict = listEndpoints().find(
    (e) =>
      e.id !== endpoint.id &&
      e.method === endpoint.method &&
      e.path === endpoint.path &&
      e.version === endpoint.version
  );
  if (conflict) {
    issues.push({
      path: "path",
      code: "duplicate_route",
      message: `Route ${endpoint.method} ${endpoint.path}@${endpoint.version} already registered as "${conflict.id}"`,
    });
  }

  return { valid: issues.length === 0, issues };
}

function resolveExpectedKeys(ref: ApiSchemaRef): {
  keys: Set<string>;
  required: Set<string>;
} | null {
  const schema = getRegisteredSchema(ref.schemaId);
  if (!schema) return null;
  const resolved = resolveSchema(ref.schemaId);
  const all = resolved.fields;
  const selected = ref.fieldKeys?.length
    ? all.filter((f) => ref.fieldKeys!.includes(f.key))
    : all;
  return {
    keys: new Set(selected.map((f) => f.key)),
    required: new Set(
      selected
        .filter((f) => f.required || f.constraints?.required)
        .map((f) => f.key)
    ),
  };
}

/**
 * Validate a request payload against the endpoint's request schema ref.
 */
export function validateRequestAgainstSchema(
  endpoint: PlatformEndpoint,
  body: unknown
): ApiValidationResult {
  const issues: ApiValidationIssue[] = [];
  const ref = endpoint.requestSchema;
  if (!ref) {
    return { valid: true, issues };
  }

  const expected = resolveExpectedKeys(ref);
  if (!expected) {
    issues.push({
      path: "requestSchema",
      code: "unknown_schema",
      message: `Schema "${ref.schemaId}" is not registered`,
    });
    return { valid: false, issues };
  }

  // GET/HEAD typically have no body — allow empty
  if (
    (endpoint.method === "GET" || endpoint.method === "HEAD") &&
    (body === undefined || body === null)
  ) {
    return { valid: true, issues };
  }

  const record = requestBodyAsRecord(body);
  if (!record) {
    issues.push({
      path: "body",
      code: "invalid_body",
      message: "Request body must be a JSON object",
    });
    return { valid: false, issues };
  }

  for (const key of expected.required) {
    const value = record[key];
    if (value === undefined || value === null || value === "") {
      issues.push({
        path: key,
        code: "required",
        message: `Field "${key}" is required`,
      });
    }
  }

  for (const key of Object.keys(record)) {
    if (!expected.keys.has(key)) {
      issues.push({
        path: key,
        code: "unknown_field",
        message: `Field "${key}" is not in request schema "${ref.schemaId}"`,
      });
    }
  }

  return { valid: issues.length === 0, issues };
}
