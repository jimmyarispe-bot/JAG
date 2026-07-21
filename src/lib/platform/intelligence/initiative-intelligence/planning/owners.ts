/**
 * Role-based ownership — integrates with RBAC assignment keys, not hard-coded users.
 */

import type {
  InitiativeOwner,
  InitiativeOwnershipRole,
} from "@/lib/platform/intelligence/initiative-intelligence/types";

const DEFAULT_ASSIGNMENTS: Record<InitiativeOwnershipRole, string> = {
  executive_sponsor: "role:executive",
  initiative_owner: "role:initiative_owner",
  contributor: "role:contributor",
  reviewer: "role:reviewer",
  approver: "role:approver",
};

const LABELS: Record<InitiativeOwnershipRole, string> = {
  executive_sponsor: "Executive Sponsor",
  initiative_owner: "Initiative Owner",
  contributor: "Contributor",
  reviewer: "Reviewer",
  approver: "Approver",
};

export function defaultOwners(): InitiativeOwner[] {
  return (Object.keys(DEFAULT_ASSIGNMENTS) as InitiativeOwnershipRole[]).map((role) => ({
    role,
    assignmentKey: DEFAULT_ASSIGNMENTS[role],
    label: LABELS[role],
  }));
}

export function ownersForCategory(category?: string): InitiativeOwner[] {
  const owners = defaultOwners();
  if (category === "staffing" || category === "enrollment") {
    return owners.map((o) =>
      o.role === "initiative_owner"
        ? { ...o, assignmentKey: "role:school_leader", label: "School Leader (Owner)" }
        : o
    );
  }
  if (category === "finance" || category === "funding") {
    return owners.map((o) =>
      o.role === "approver"
        ? { ...o, assignmentKey: "role:finance_approver", label: "Finance Approver" }
        : o
    );
  }
  return owners;
}

export function requireOwnerRole(
  owners: InitiativeOwner[],
  role: InitiativeOwnershipRole
): InitiativeOwner | undefined {
  return owners.find((o) => o.role === role);
}
