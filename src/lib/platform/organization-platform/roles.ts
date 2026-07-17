import type { OrganizationPlatformRole, TenantPermission } from "./types";

export const ORGANIZATION_PLATFORM_ROLES: OrganizationPlatformRole[] = [
  "platform_admin",
  "founder",
  "organization_owner",
  "ceo",
  "executive",
  "board_member",
  "department_leader",
  "manager",
  "employee",
  "advisor",
  "guest",
];

export const ROLE_LABELS: Record<OrganizationPlatformRole, string> = {
  platform_admin: "Platform Admin",
  founder: "Founder",
  organization_owner: "Organization Owner",
  ceo: "CEO",
  executive: "Executive",
  board_member: "Board Member",
  department_leader: "Department Leader",
  manager: "Manager",
  employee: "Employee",
  advisor: "Advisor",
  guest: "Guest",
};

const ALL: TenantPermission[] = [
  "platform.admin",
  "org.read",
  "org.write",
  "org.settings",
  "org.branding",
  "org.delete",
  "users.read",
  "users.invite",
  "users.manage",
  "users.deactivate",
  "roles.assign",
  "locations.manage",
  "departments.manage",
  "teams.manage",
  "integrations.read",
  "integrations.manage",
  "exec.access",
  "intelligence.query",
  "audit.read",
  "secrets.manage",
];

/** Role → permission matrix (deny by omission). */
export const ROLE_PERMISSIONS: Record<OrganizationPlatformRole, TenantPermission[]> = {
  platform_admin: [...ALL],
  founder: ALL.filter((p) => p !== "platform.admin"),
  organization_owner: ALL.filter((p) => p !== "platform.admin" && p !== "org.delete"),
  ceo: [
    "org.read",
    "org.write",
    "org.settings",
    "org.branding",
    "users.read",
    "users.invite",
    "users.manage",
    "users.deactivate",
    "roles.assign",
    "locations.manage",
    "departments.manage",
    "teams.manage",
    "integrations.read",
    "integrations.manage",
    "exec.access",
    "intelligence.query",
    "audit.read",
    "secrets.manage",
  ],
  executive: [
    "org.read",
    "org.settings",
    "users.read",
    "integrations.read",
    "exec.access",
    "intelligence.query",
    "audit.read",
  ],
  board_member: ["org.read", "exec.access", "intelligence.query", "audit.read"],
  department_leader: [
    "org.read",
    "users.read",
    "departments.manage",
    "teams.manage",
    "exec.access",
    "intelligence.query",
  ],
  manager: ["org.read", "users.read", "teams.manage", "intelligence.query"],
  employee: ["org.read", "intelligence.query"],
  advisor: ["org.read", "exec.access", "intelligence.query"],
  guest: ["org.read"],
};

export function permissionsForRole(role: OrganizationPlatformRole): TenantPermission[] {
  return [...ROLE_PERMISSIONS[role]];
}

export function roleHasPermission(
  role: OrganizationPlatformRole,
  permission: TenantPermission
): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
