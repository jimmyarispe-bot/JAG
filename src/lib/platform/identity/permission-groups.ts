/**
 * Enterprise IAM — permission groups.
 *
 * Strongly typed access bundles over the PermissionKey catalog.
 * Groups do not replace roles; roles continue to grant individual permissions.
 * Group IDs align with the official permission catalog.
 */

import {
  PERMISSION_CATALOG,
  PERMISSION_CATALOG_DEFINITIONS,
  type CatalogPermission,
} from "@/lib/platform/identity/permission-catalog";
import type { OfficialPlatformRole } from "@/lib/platform/identity/platform-roles";
import { PERMISSION_KEYS, type PermissionKey } from "@/lib/platform/identity/types";
import type { EduRoleName } from "@/types/database";

export const PERMISSION_GROUP_IDS = PERMISSION_CATALOG;
export type PermissionGroupId = CatalogPermission;

export interface PermissionGroupDefinition {
  readonly id: PermissionGroupId;
  readonly label: string;
  readonly description: string;
  /** Coarse gate key (also a PermissionKey) for this group. */
  readonly gate: PermissionGroupId;
  /** Granular permissions included in this access group. */
  readonly permissions: readonly PermissionKey[];
}

type PermissionGroupMap = {
  readonly [K in PermissionGroupId]: Omit<PermissionGroupDefinition, "id" | "gate"> & {
    readonly id: K;
    readonly gate: K;
  };
};

export const PERMISSION_GROUP_DEFINITIONS: PermissionGroupMap = {
  JAG_ACCESS: {
    id: "JAG_ACCESS",
    gate: "JAG_ACCESS",
    label: PERMISSION_CATALOG_DEFINITIONS.JAG_ACCESS.label,
    description: PERMISSION_CATALOG_DEFINITIONS.JAG_ACCESS.description,
    permissions: [
      "JAG_ACCESS",
      "mission_control.access",
      "executive.dashboard",
      "executive.intelligence",
      "executive.board_reports",
      "executive.strategic",
      "executive.risk_view",
      "founder.override",
      "founder.emergency_access",
      "edi.view",
      "edi.executive",
      "ai.executive",
      "search.global",
    ],
  },
  ACADEMYOS_ACCESS: {
    id: "ACADEMYOS_ACCESS",
    gate: "ACADEMYOS_ACCESS",
    label: PERMISSION_CATALOG_DEFINITIONS.ACADEMYOS_ACCESS.label,
    description: PERMISSION_CATALOG_DEFINITIONS.ACADEMYOS_ACCESS.description,
    permissions: [
      "ACADEMYOS_ACCESS",
      "org.view",
      "directory.view",
      "mission_control.access",
      "workflows.view",
      "school.configure",
      "search.global",
      "executive.dashboard",
      "executive.intelligence",
      "certification.view",
    ],
  },
  FINANCE_ACCESS: {
    id: "FINANCE_ACCESS",
    gate: "FINANCE_ACCESS",
    label: PERMISSION_CATALOG_DEFINITIONS.FINANCE_ACCESS.label,
    description: PERMISSION_CATALOG_DEFINITIONS.FINANCE_ACCESS.description,
    permissions: [
      // Sprint 008 — Financial Security surfaces
      "FINANCE_ACCESS",
      "ACCOUNTING_ACCESS",
      "BANKING_ACCESS",
      "PAYROLL_ACCESS",
      "finance.view",
      "finance.override_tuition",
      "finance.export",
      "finance.executive",
      "finance.forecast",
      "finance.billing",
      "finance.scholarships",
      "finance.state_funding",
      "finance.accounting",
      "finance.banking",
      "finance.payroll",
      "finance.audit",
      "finance.approve",
      "payroll.run",
      "fi.view",
      "fi.manage",
      "fi.executive",
      "fi.import",
      "fi.scenarios",
      "scholarships.view",
      "funding.view",
      "funding.verify",
      "funding.export",
    ],
  },
  BANKING_ACCESS: {
    id: "BANKING_ACCESS",
    gate: "BANKING_ACCESS",
    label: PERMISSION_CATALOG_DEFINITIONS.BANKING_ACCESS.label,
    description: PERMISSION_CATALOG_DEFINITIONS.BANKING_ACCESS.description,
    permissions: ["BANKING_ACCESS", "finance.banking", "finance.audit", "fi.view"],
  },
  ACCOUNTING_ACCESS: {
    id: "ACCOUNTING_ACCESS",
    gate: "ACCOUNTING_ACCESS",
    label: PERMISSION_CATALOG_DEFINITIONS.ACCOUNTING_ACCESS.label,
    description: PERMISSION_CATALOG_DEFINITIONS.ACCOUNTING_ACCESS.description,
    permissions: [
      "ACCOUNTING_ACCESS",
      "finance.accounting",
      "finance.view",
      "finance.export",
      "finance.audit",
      "fi.view",
      "fi.manage",
    ],
  },
  PAYROLL_ACCESS: {
    id: "PAYROLL_ACCESS",
    gate: "PAYROLL_ACCESS",
    label: PERMISSION_CATALOG_DEFINITIONS.PAYROLL_ACCESS.label,
    description: PERMISSION_CATALOG_DEFINITIONS.PAYROLL_ACCESS.description,
    permissions: ["PAYROLL_ACCESS", "payroll.run", "finance.payroll"],
  },
  HR_ACCESS: {
    id: "HR_ACCESS",
    gate: "HR_ACCESS",
    label: PERMISSION_CATALOG_DEFINITIONS.HR_ACCESS.label,
    description: PERMISSION_CATALOG_DEFINITIONS.HR_ACCESS.description,
    permissions: [
      "HR_ACCESS",
      "hr.view",
      "hr.manage",
      "hr.recruiting",
      "hr.compliance",
      "hr.analytics",
      "employee.self_service",
    ],
  },
  ADMISSIONS_ACCESS: {
    id: "ADMISSIONS_ACCESS",
    gate: "ADMISSIONS_ACCESS",
    label: PERMISSION_CATALOG_DEFINITIONS.ADMISSIONS_ACCESS.label,
    description: PERMISSION_CATALOG_DEFINITIONS.ADMISSIONS_ACCESS.description,
    permissions: [
      "ADMISSIONS_ACCESS",
      "admissions.view",
      "admissions.accept",
      "admissions.manage",
      "scholarships.view",
      "scholarships.approve",
    ],
  },
  SIS_ACCESS: {
    id: "SIS_ACCESS",
    gate: "SIS_ACCESS",
    label: PERMISSION_CATALOG_DEFINITIONS.SIS_ACCESS.label,
    description: PERMISSION_CATALOG_DEFINITIONS.SIS_ACCESS.description,
    permissions: [
      "SIS_ACCESS",
      "students.view",
      "students.edit",
      "ferpa.view_iep",
      "ferpa.view_medical",
      "ferpa.view_discipline",
      "ferpa.view_evaluations",
      "records.unlock",
    ],
  },
  TEACHER_ACCESS: {
    id: "TEACHER_ACCESS",
    gate: "TEACHER_ACCESS",
    label: PERMISSION_CATALOG_DEFINITIONS.TEACHER_ACCESS.label,
    description: PERMISSION_CATALOG_DEFINITIONS.TEACHER_ACCESS.description,
    permissions: [
      "TEACHER_ACCESS",
      "ACADEMYOS_ACCESS",
      "teacher.view",
      "teacher.manage",
      "teacher.attendance",
      "teacher.communicate",
      "teacher.compliance",
      "students.view",
      "students.attendance",
      "instruction.executive",
      "scheduling.executive",
      "ai.teacher",
      "ai.use",
      "work.view",
    ],
  },
  PARENT_ACCESS: {
    id: "PARENT_ACCESS",
    gate: "PARENT_ACCESS",
    label: PERMISSION_CATALOG_DEFINITIONS.PARENT_ACCESS.label,
    description: PERMISSION_CATALOG_DEFINITIONS.PARENT_ACCESS.description,
    permissions: ["PARENT_ACCESS", "portal.parent.access", "ai.parent"],
  },
  STUDENT_ACCESS: {
    id: "STUDENT_ACCESS",
    gate: "STUDENT_ACCESS",
    label: PERMISSION_CATALOG_DEFINITIONS.STUDENT_ACCESS.label,
    description: PERMISSION_CATALOG_DEFINITIONS.STUDENT_ACCESS.description,
    permissions: ["STUDENT_ACCESS", "portal.student.access", "ai.student"],
  },
  USER_MANAGEMENT_ACCESS: {
    id: "USER_MANAGEMENT_ACCESS",
    gate: "USER_MANAGEMENT_ACCESS",
    label: PERMISSION_CATALOG_DEFINITIONS.USER_MANAGEMENT_ACCESS.label,
    description: PERMISSION_CATALOG_DEFINITIONS.USER_MANAGEMENT_ACCESS.description,
    permissions: [
      "USER_MANAGEMENT_ACCESS",
      "users.view",
      "users.manage",
      "roles.view",
      "roles.manage",
      "impersonate.users",
      "directory.view",
    ],
  },
  SYSTEM_ADMIN_ACCESS: {
    id: "SYSTEM_ADMIN_ACCESS",
    gate: "SYSTEM_ADMIN_ACCESS",
    label: PERMISSION_CATALOG_DEFINITIONS.SYSTEM_ADMIN_ACCESS.label,
    description: PERMISSION_CATALOG_DEFINITIONS.SYSTEM_ADMIN_ACCESS.description,
    permissions: [
      "SYSTEM_ADMIN_ACCESS",
      "org.manage",
      "schools.access_all",
      "security.view",
      "licensing.manage",
      "configuration.view",
      "configuration.manage",
      "configuration.admin",
      "configuration.launch",
      "data.view",
      "data.manage",
      "data.admin",
      "cloud.admin",
      "certification.view",
      "certification.manage",
      "certification.admin",
      "approvals.configure",
      "ai.admin",
      "ai.manage",
      "integration.admin",
      "network.admin",
      "operations.manage",
      "compliance.view",
      "compliance.manage",
      "compliance.admin",
      "work.view",
      "work.manage",
      "work.admin",
      "edi.manage",
      "edi.executive",
    ],
  },
  AUDIT_ACCESS: {
    id: "AUDIT_ACCESS",
    gate: "AUDIT_ACCESS",
    label: PERMISSION_CATALOG_DEFINITIONS.AUDIT_ACCESS.label,
    description: PERMISSION_CATALOG_DEFINITIONS.AUDIT_ACCESS.description,
    permissions: ["AUDIT_ACCESS", "audit.view_all", "security.view", "finance.audit"],
  },
  REPORTING_ACCESS: {
    id: "REPORTING_ACCESS",
    gate: "REPORTING_ACCESS",
    label: PERMISSION_CATALOG_DEFINITIONS.REPORTING_ACCESS.label,
    description: PERMISSION_CATALOG_DEFINITIONS.REPORTING_ACCESS.description,
    permissions: [
      "REPORTING_ACCESS",
      "global.reporting",
      "executive.board_reports",
      "compliance.view",
      "compliance.reports",
      "work.reports",
      "finance.export",
      "funding.export",
    ],
  },
};

export function isPermissionGroupId(value: string): value is PermissionGroupId {
  return (PERMISSION_GROUP_IDS as readonly string[]).includes(value);
}

export function getPermissionGroup(group: PermissionGroupId): PermissionGroupDefinition {
  return PERMISSION_GROUP_DEFINITIONS[group];
}

export function permissionsForGroup(group: PermissionGroupId): readonly PermissionKey[] {
  return PERMISSION_GROUP_DEFINITIONS[group].permissions;
}

export function isPermissionInGroup(
  permission: PermissionKey,
  group: PermissionGroupId
): boolean {
  return (PERMISSION_GROUP_DEFINITIONS[group].permissions as readonly string[]).includes(
    permission
  );
}

/** Groups that include the given permission key. */
export function groupsContainingPermission(permission: PermissionKey): PermissionGroupId[] {
  return PERMISSION_GROUP_IDS.filter((group) => isPermissionInGroup(permission, group));
}

/**
 * True when the grantee has the group gate key or any granular permission in the group.
 */
export function hasAccessGroup(
  granted: ReadonlySet<string> | readonly string[],
  group: PermissionGroupId
): boolean {
  const set = granted instanceof Set ? granted : new Set(granted);
  if (set.has(group)) return true;
  return PERMISSION_GROUP_DEFINITIONS[group].permissions.some((key) => set.has(key));
}

/** True when every granular permission in the group is granted (gate key alone is insufficient). */
export function hasFullAccessGroup(
  granted: ReadonlySet<string> | readonly string[],
  group: PermissionGroupId
): boolean {
  const set = granted instanceof Set ? granted : new Set(granted);
  return PERMISSION_GROUP_DEFINITIONS[group].permissions.every((key) => set.has(key));
}

/** Flat unique list of all permissions referenced by any access group. */
export function allGroupedPermissions(): PermissionKey[] {
  const keys = new Set<PermissionKey>();
  for (const group of PERMISSION_GROUP_IDS) {
    for (const key of PERMISSION_GROUP_DEFINITIONS[group].permissions) {
      keys.add(key);
    }
  }
  return [...keys];
}

/**
 * Sprint 006 — Role → permission-group mapping.
 * Roles grant permissions only; call sites must use authorize()/hasPermission().
 * Legacy roles (CEO, FINANCE, …) remain mapped and are not removed.
 */
export const ROLE_PERMISSION_GROUPS = {
  /** Founder receives every catalog permission. */
  FOUNDER: PERMISSION_CATALOG,
  // Sprint 007 — CEO must not receive JAG_ACCESS (Founder Protection).
  CEO: [
    "ACADEMYOS_ACCESS",
    "FINANCE_ACCESS",
    "BANKING_ACCESS",
    "ACCOUNTING_ACCESS",
    "PAYROLL_ACCESS",
    "HR_ACCESS",
    "ADMISSIONS_ACCESS",
    "SIS_ACCESS",
    "REPORTING_ACCESS",
    "USER_MANAGEMENT_ACCESS",
    "SYSTEM_ADMIN_ACCESS",
    "AUDIT_ACCESS",
  ],
  /** AcademyOS, Finance, HR, Payroll, Admissions, Reporting */
  EXECUTIVE_DIRECTOR: [
    "ACADEMYOS_ACCESS",
    "FINANCE_ACCESS",
    "HR_ACCESS",
    "PAYROLL_ACCESS",
    "ADMISSIONS_ACCESS",
    "REPORTING_ACCESS",
  ],
  /** AcademyOS, Admissions, SIS, Reporting */
  SCHOOL_LEADER: [
    "ACADEMYOS_ACCESS",
    "ADMISSIONS_ACCESS",
    "SIS_ACCESS",
    "REPORTING_ACCESS",
  ],
  ADMINISTRATOR: [
    "ACADEMYOS_ACCESS",
    "USER_MANAGEMENT_ACCESS",
    "SYSTEM_ADMIN_ACCESS",
    "REPORTING_ACCESS",
    "AUDIT_ACCESS",
  ],
  /** Teacher Workspace */
  TEACHER: ["TEACHER_ACCESS"],
  /** Parent Portal */
  PARENT: ["PARENT_ACCESS"],
  /** Student Portal */
  STUDENT: ["STUDENT_ACCESS"],
  ACCOUNTING: [
    "ACADEMYOS_ACCESS",
    "FINANCE_ACCESS",
    "ACCOUNTING_ACCESS",
    "PAYROLL_ACCESS",
    "BANKING_ACCESS",
    "REPORTING_ACCESS",
  ],
  FINANCE: [
    "ACADEMYOS_ACCESS",
    "FINANCE_ACCESS",
    "ACCOUNTING_ACCESS",
    "PAYROLL_ACCESS",
    "BANKING_ACCESS",
    "REPORTING_ACCESS",
  ],
  HR: ["ACADEMYOS_ACCESS", "HR_ACCESS", "PAYROLL_ACCESS"],
  ADMISSIONS: ["ACADEMYOS_ACCESS", "ADMISSIONS_ACCESS"],
  BOARD_MEMBER: ["ACADEMYOS_ACCESS", "REPORTING_ACCESS"],
} as const satisfies Partial<Record<EduRoleName, readonly PermissionGroupId[]>> &
  Record<OfficialPlatformRole, readonly PermissionGroupId[]>;

export type MappedIamRole = keyof typeof ROLE_PERMISSION_GROUPS;

/**
 * Additional permissions granted by role (still role→permission; never checked at call sites).
 * Used for grants that do not fit a shared catalog group without over-granting other roles.
 */
export const ROLE_EXTRA_PERMISSIONS = {
  EXECUTIVE_DIRECTOR: ["schools.access_all"],
} as const satisfies Partial<Record<EduRoleName, readonly PermissionKey[]>>;

export function isMappedIamRole(role: string): role is MappedIamRole {
  return Object.prototype.hasOwnProperty.call(ROLE_PERMISSION_GROUPS, role);
}

export function permissionGroupsForRole(role: string): readonly PermissionGroupId[] {
  if (!isMappedIamRole(role)) return [];
  return ROLE_PERMISSION_GROUPS[role];
}

export function permissionGroupsForRoles(roles: readonly string[]): PermissionGroupId[] {
  const groups = new Set<PermissionGroupId>();
  for (const role of roles) {
    for (const group of permissionGroupsForRole(role)) {
      groups.add(group);
    }
  }
  return [...groups];
}

/** Expand a role's mapped groups into the full PermissionKey set. */
export function permissionsForMappedRole(role: string): PermissionKey[] {
  // Sprint 006 — Founder receives every permission.
  if (role === "FOUNDER") {
    return [...PERMISSION_KEYS];
  }

  const keys = new Set<PermissionKey>();
  for (const group of permissionGroupsForRole(role)) {
    for (const key of PERMISSION_GROUP_DEFINITIONS[group].permissions) {
      keys.add(key);
    }
  }
  const extras =
    ROLE_EXTRA_PERMISSIONS[role as keyof typeof ROLE_EXTRA_PERMISSIONS] ?? [];
  for (const key of extras) {
    keys.add(key);
  }
  return [...keys];
}

/** Expand multiple roles' mapped groups into a unique PermissionKey set. */
export function permissionsForMappedRoles(roles: readonly string[]): Set<PermissionKey> {
  const keys = new Set<PermissionKey>();
  for (const role of roles) {
    for (const key of permissionsForMappedRole(role)) {
      keys.add(key);
    }
  }
  return keys;
}

export function roleHasPermissionGroup(role: string, group: PermissionGroupId): boolean {
  return (permissionGroupsForRole(role) as readonly PermissionGroupId[]).includes(group);
}

export function rolesHavePermissionGroup(
  roles: readonly string[],
  group: PermissionGroupId
): boolean {
  return roles.some((role) => roleHasPermissionGroup(role, group));
}

export function roleMappingGrantsPermission(
  roles: readonly string[],
  permissionKey: PermissionKey
): boolean {
  return permissionsForMappedRoles(roles).has(permissionKey);
}
