/** Permission SDK — reusable permission definitions (interfaces only). */

export const PERMISSION_SCOPES = [
  "Platform",
  "Organization",
  "Product",
  "Extension",
  "Connector",
] as const;

export type PermissionScope = (typeof PERMISSION_SCOPES)[number];

export type PermissionDefinition = {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly scope: PermissionScope;
  readonly resource: string;
  readonly actions: readonly string[];
};

export type PermissionSet = {
  readonly permissions: readonly PermissionDefinition[];
};
