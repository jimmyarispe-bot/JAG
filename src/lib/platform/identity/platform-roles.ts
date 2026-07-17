/**
 * Sprint 005 — Official Platform Roles.
 *
 * Canonical role catalog for the JAG Platform.
 * Roles grant permissions via ROLE_PERMISSION_GROUPS — never check roles at call sites.
 *
 * Existing roles outside this list (e.g. CEO, FINANCE, REGISTRAR) are preserved
 * and remain valid. This module is additive only.
 */

import type { EduRoleName } from "@/types/database";

/** Official platform roles (Sprint 005). Do not remove existing/legacy roles elsewhere. */
export const OFFICIAL_PLATFORM_ROLES = [
  "FOUNDER",
  "EXECUTIVE_DIRECTOR",
  "SCHOOL_LEADER",
  "ADMINISTRATOR",
  "ACCOUNTING",
  "HR",
  "ADMISSIONS",
  "TEACHER",
  "PARENT",
  "STUDENT",
  "BOARD_MEMBER",
] as const;

export type OfficialPlatformRole = (typeof OFFICIAL_PLATFORM_ROLES)[number];

export type PlatformRoleDefinition = {
  readonly id: OfficialPlatformRole;
  readonly label: string;
  readonly description: string;
  readonly sortOrder: number;
};

export const OFFICIAL_PLATFORM_ROLE_DEFINITIONS: {
  readonly [K in OfficialPlatformRole]: PlatformRoleDefinition & { readonly id: K };
} = {
  FOUNDER: {
    id: "FOUNDER",
    label: "Founder",
    description: "Highest platform role with JAG and AcademyOS access.",
    sortOrder: 10,
  },
  EXECUTIVE_DIRECTOR: {
    id: "EXECUTIVE_DIRECTOR",
    label: "Executive Director",
    description: "Executive leadership across schools and AcademyOS modules.",
    sortOrder: 20,
  },
  SCHOOL_LEADER: {
    id: "SCHOOL_LEADER",
    label: "School Leader",
    description: "School-level leadership for admissions, SIS, and reporting.",
    sortOrder: 30,
  },
  ADMINISTRATOR: {
    id: "ADMINISTRATOR",
    label: "Administrator",
    description: "Platform administration, users, roles, and system configuration.",
    sortOrder: 40,
  },
  ACCOUNTING: {
    id: "ACCOUNTING",
    label: "Accounting",
    description: "Accounting, banking, and financial operations access.",
    sortOrder: 50,
  },
  HR: {
    id: "HR",
    label: "Human Resources",
    description: "Workforce, recruiting, and HR operations.",
    sortOrder: 60,
  },
  ADMISSIONS: {
    id: "ADMISSIONS",
    label: "Admissions",
    description: "Admissions pipeline and enrollment operations.",
    sortOrder: 70,
  },
  TEACHER: {
    id: "TEACHER",
    label: "Teacher",
    description: "Instructional staff with teacher workspace access.",
    sortOrder: 80,
  },
  PARENT: {
    id: "PARENT",
    label: "Parent",
    description: "Parent portal access for families.",
    sortOrder: 90,
  },
  STUDENT: {
    id: "STUDENT",
    label: "Student",
    description: "Student portal access.",
    sortOrder: 100,
  },
  BOARD_MEMBER: {
    id: "BOARD_MEMBER",
    label: "Board Member",
    description: "Board governance and reporting access.",
    sortOrder: 110,
  },
};

export function isOfficialPlatformRole(role: string): role is OfficialPlatformRole {
  return (OFFICIAL_PLATFORM_ROLES as readonly string[]).includes(role);
}

export function getOfficialPlatformRole(role: OfficialPlatformRole): PlatformRoleDefinition {
  return OFFICIAL_PLATFORM_ROLE_DEFINITIONS[role];
}

export function officialPlatformRoleIds(): readonly OfficialPlatformRole[] {
  return OFFICIAL_PLATFORM_ROLES;
}

export function officialPlatformRoleDefinitions(): PlatformRoleDefinition[] {
  return OFFICIAL_PLATFORM_ROLES.map((id) => OFFICIAL_PLATFORM_ROLE_DEFINITIONS[id]);
}

/** Official roles plus any additional EduRoleName values already on the user. */
export function normalizePlatformRoles(roles: readonly string[]): EduRoleName[] {
  return roles.filter((role): role is EduRoleName => Boolean(role));
}

export function officialRolesFrom(roles: readonly string[]): OfficialPlatformRole[] {
  return roles.filter(isOfficialPlatformRole);
}

/** Legacy / non-official roles that remain valid and must not be removed. */
export function legacyRolesFrom(roles: readonly string[]): string[] {
  return roles.filter((role) => !isOfficialPlatformRole(role));
}
