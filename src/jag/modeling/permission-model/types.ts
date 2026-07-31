/**
 * PermissionModel — declarative permission pack contribution.
 * Registered via compiler ports (no dedicated JAG permission engine registry yet).
 */

export type PermissionModel = {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly permissions: readonly string[];
};
