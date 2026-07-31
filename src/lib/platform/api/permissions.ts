import type { PlatformEndpoint } from "@/lib/platform/api/types";

function toSet(
  granted: ReadonlySet<string> | readonly string[] | undefined
): Set<string> {
  if (!granted) return new Set();
  return granted instanceof Set ? new Set(granted) : new Set(granted);
}

/**
 * Resolve the IAM permission key for an endpoint action.
 * Applications configure required permissions; platform evaluates them.
 */
export function resolveEndpointPermission(
  endpoint: PlatformEndpoint,
  action = "invoke"
): string | null {
  const exact = endpoint.permissions.find((p) => p.action === action);
  if (exact) return exact.permission;
  const invoke = endpoint.permissions.find((p) => p.action === "invoke");
  return invoke?.permission ?? endpoint.permissions[0]?.permission ?? null;
}

export function listEndpointPermissions(
  endpoint: PlatformEndpoint
): string[] {
  return [...new Set(endpoint.permissions.map((p) => p.permission))];
}

export function canInvokeEndpoint(input: {
  endpoint: PlatformEndpoint;
  action?: string;
  grantedPermissions?: ReadonlySet<string> | readonly string[];
}): boolean {
  const permission = resolveEndpointPermission(
    input.endpoint,
    input.action ?? "invoke"
  );
  if (!permission) return true;
  return toSet(input.grantedPermissions).has(permission);
}

export function assertEndpointAllowed(input: {
  endpoint: PlatformEndpoint;
  action?: string;
  grantedPermissions?: ReadonlySet<string> | readonly string[];
}): void {
  if (!canInvokeEndpoint(input)) {
    const permission = resolveEndpointPermission(
      input.endpoint,
      input.action ?? "invoke"
    );
    throw new Error(
      `Permission denied: requires ${permission} for endpoint ${input.endpoint.id}`
    );
  }
}
