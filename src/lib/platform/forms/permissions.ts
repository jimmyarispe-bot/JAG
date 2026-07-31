import type { FormDefinition } from "@/lib/platform/forms/types";

export function resolveFormPermission(
  definition: FormDefinition,
  action: "view" | "submit" | "edit"
): string | null {
  return definition.permissions.find((p) => p.action === action)?.permission ?? null;
}

export function canPerformFormAction(input: {
  definition: FormDefinition;
  action: "view" | "submit" | "edit";
  grantedPermissions: ReadonlySet<string> | readonly string[];
}): boolean {
  const permission = resolveFormPermission(input.definition, input.action);
  if (!permission) return true;
  const granted =
    input.grantedPermissions instanceof Set
      ? input.grantedPermissions
      : new Set(input.grantedPermissions);
  return granted.has(permission);
}

export function assertFormActionAllowed(input: {
  definition: FormDefinition;
  action: "view" | "submit" | "edit";
  grantedPermissions: ReadonlySet<string> | readonly string[];
}): void {
  if (!canPerformFormAction(input)) {
    const permission = resolveFormPermission(input.definition, input.action);
    throw new Error(
      `Permission denied: requires ${permission} for form ${input.definition.id}.${input.action}`
    );
  }
}
