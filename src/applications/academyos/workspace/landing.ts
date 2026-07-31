/**
 * Centralized post-auth workspace landing resolver.
 * Maps identity → existing /dashboard/* or /portal/* routes (no new shells).
 */

export type WorkspaceLandingInput = {
  roles: readonly string[];
  primaryRole?: string | null;
  permissions?: readonly string[];
};

export const ACADEMY_WORKSPACE_ENTRY = "/workspace";

const DEFAULT_LANDING = "/dashboard";

function hasRole(roles: ReadonlySet<string>, role: string): boolean {
  return roles.has(role);
}

function hasPerm(perms: ReadonlySet<string>, key: string): boolean {
  return perms.has(key);
}

/**
 * Resolve the landing route for an authenticated user.
 * More specific portal / teaching roles win over generic staff home.
 */
export function resolveAcademyWorkspaceLanding(
  input: WorkspaceLandingInput
): string {
  const roles = new Set(input.roles.map((r) => r.toUpperCase()));
  const perms = new Set(input.permissions ?? []);
  const primary = (input.primaryRole ?? "").toUpperCase();

  // Student / parent portals first (avoid landing them on staff dashboard).
  if (
    hasRole(roles, "STUDENT") ||
    primary === "STUDENT" ||
    hasPerm(perms, "STUDENT_ACCESS") ||
    hasPerm(perms, "portal.student.access")
  ) {
    return "/portal/student";
  }

  if (
    hasRole(roles, "PARENT") ||
    primary === "PARENT" ||
    hasPerm(perms, "PARENT_ACCESS") ||
    hasPerm(perms, "portal.parent.access")
  ) {
    return "/portal";
  }

  if (
    hasRole(roles, "TEACHER") ||
    primary === "TEACHER" ||
    hasPerm(perms, "TEACHER_ACCESS")
  ) {
    return "/dashboard/teacher";
  }

  if (
    hasRole(roles, "EMPLOYEE") ||
    primary === "EMPLOYEE" ||
    hasPerm(perms, "employee.self_service")
  ) {
    // Prefer employee portal when they are not also an operating leader.
    if (
      !hasRole(roles, "FOUNDER") &&
      !hasRole(roles, "CEO") &&
      !hasRole(roles, "EXECUTIVE_DIRECTOR") &&
      !hasRole(roles, "SCHOOL_LEADER") &&
      !hasPerm(perms, "JAG_ACCESS")
    ) {
      return "/dashboard/employee";
    }
  }

  // Founder morning brief remains the founder executive home (existing UX).
  if (hasRole(roles, "FOUNDER") || hasPerm(perms, "JAG_ACCESS")) {
    return "/dashboard";
  }

  if (
    hasRole(roles, "CEO") ||
    hasRole(roles, "EXECUTIVE_DIRECTOR") ||
    primary === "CEO" ||
    primary === "EXECUTIVE_DIRECTOR"
  ) {
    return "/dashboard/executive";
  }

  if (hasRole(roles, "SCHOOL_LEADER") || primary === "SCHOOL_LEADER") {
    return "/dashboard";
  }

  return DEFAULT_LANDING;
}
