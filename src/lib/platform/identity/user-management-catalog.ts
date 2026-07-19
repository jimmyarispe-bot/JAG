/**
 * P1.03 — User Management catalog (roles, statuses, CSV columns).
 */

export const USER_MANAGEMENT_ROLE_OPTIONS = [
  { value: "FOUNDER", label: "Founder" },
  { value: "CEO", label: "CEO" },
  { value: "EXECUTIVE_DIRECTOR", label: "Executive Director of Schools" },
  { value: "ADMINISTRATOR", label: "Administrator" },
  { value: "SCHOOL_LEADER", label: "School Leader" },
  { value: "TEACHER", label: "Teacher" },
  { value: "PARENT", label: "Parent" },
  { value: "STUDENT", label: "Student" },
  { value: "EMPLOYEE", label: "Employee" },
] as const;

export type UserManagementRoleValue =
  (typeof USER_MANAGEMENT_ROLE_OPTIONS)[number]["value"];

export const USER_MANAGEMENT_STATUSES = [
  { value: "pending_invite", label: "Pending Invite" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
] as const;

export type UserManagementStatus =
  (typeof USER_MANAGEMENT_STATUSES)[number]["value"];

export const USER_CSV_COLUMNS = [
  "First Name",
  "Last Name",
  "Email",
  "Role",
  "School",
  "Department",
  "Phone",
  "Status",
] as const;

export const USER_CSV_TEMPLATE = `${USER_CSV_COLUMNS.join(",")}
Jimmy,Arispe,jimmy@example.org,Founder,Academy FL,,555-0100,Active
Danni,Treu,danni@example.org,Executive Director of Schools,Academy GA,,,Pending Invite
Mahogany,Murphy,mahogany@example.org,Administrator,Academy NJ,,,Active
Heather,Badger Brown,heather@example.org,School Leader,Academy Virtual,,,Active
`;

const ROLE_ALIASES: Record<string, UserManagementRoleValue> = {
  founder: "FOUNDER",
  ceo: "CEO",
  "executive director": "EXECUTIVE_DIRECTOR",
  "executive director of schools": "EXECUTIVE_DIRECTOR",
  executive_director: "EXECUTIVE_DIRECTOR",
  administrator: "ADMINISTRATOR",
  admin: "ADMINISTRATOR",
  "school leader": "SCHOOL_LEADER",
  school_leader: "SCHOOL_LEADER",
  teacher: "TEACHER",
  parent: "PARENT",
  student: "STUDENT",
  employee: "EMPLOYEE",
};

export function resolveUserManagementRole(
  input: string | null | undefined
): UserManagementRoleValue | null {
  if (!input?.trim()) return null;
  const raw = input.trim();
  const upper = raw.toUpperCase().replace(/\s+/g, "_");
  if (USER_MANAGEMENT_ROLE_OPTIONS.some((o) => o.value === upper)) {
    return upper as UserManagementRoleValue;
  }
  return ROLE_ALIASES[raw.toLowerCase()] ?? null;
}

export function resolveUserManagementStatus(
  input: string | null | undefined
): UserManagementStatus {
  const key = (input ?? "active").trim().toLowerCase().replace(/\s+/g, "_");
  if (key === "pending" || key === "pending_invite" || key === "invited") {
    return "pending_invite";
  }
  if (key === "inactive" || key === "disabled" || key === "deactivated") {
    return "inactive";
  }
  return "active";
}

export function formatUserManagementStatus(status: UserManagementStatus): string {
  return USER_MANAGEMENT_STATUSES.find((s) => s.value === status)?.label ?? status;
}
