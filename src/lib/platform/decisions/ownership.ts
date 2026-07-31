import type { DecisionOwner, DecisionOwnerRole } from "@/lib/platform/decisions/types";

/** Roles assignable in Sprint 067. */
export const SUPPORTED_DECISION_OWNER_ROLES: readonly DecisionOwnerRole[] = [
  "founder",
  "executive_director",
  "school_leader",
] as const;

export const FUTURE_DECISION_OWNER_ROLES: readonly DecisionOwnerRole[] = [
  "teacher",
  "employee",
] as const;

export function isSupportedOwnerRole(role: DecisionOwnerRole): boolean {
  return (SUPPORTED_DECISION_OWNER_ROLES as readonly string[]).includes(role);
}

export function assertAssignableOwnerRole(role: DecisionOwnerRole): void {
  if (!isSupportedOwnerRole(role)) {
    throw new Error(
      `Owner role "${role}" is not supported yet (Teacher / Employee reserved for a later sprint).`
    );
  }
}

export function buildOwner(input: {
  role: DecisionOwnerRole;
  userId?: string | null;
  displayName?: string | null;
}): DecisionOwner {
  assertAssignableOwnerRole(input.role);
  return {
    role: input.role,
    userId: input.userId ?? null,
    displayName: input.displayName ?? null,
  };
}

export function ownerLabel(owner: DecisionOwner | null): string {
  if (!owner) return "Unassigned";
  if (owner.displayName?.trim()) return owner.displayName.trim();
  switch (owner.role) {
    case "founder":
      return "Founder";
    case "executive_director":
      return "Executive Director";
    case "school_leader":
      return "School Leader";
    case "teacher":
      return "Teacher";
    case "employee":
      return "Employee";
    default:
      return owner.role;
  }
}
