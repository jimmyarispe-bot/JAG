/**
 * Sprint 004 — Permission Catalog.
 *
 * Strongly typed coarse access permissions for the JAG Platform.
 * Granular module keys (e.g. finance.view) remain in PERMISSION_KEYS.
 * Roles grant these catalog permissions via ROLE_PERMISSION_GROUPS.
 */

export const PERMISSION_CATALOG = [
  "JAG_ACCESS",
  "JAG_PLATFORM_ADMIN",
  "JAG_ORG_ACCESS",
  "ACADEMYOS_ACCESS",
  "FINANCE_ACCESS",
  "BANKING_ACCESS",
  "ACCOUNTING_ACCESS",
  "PAYROLL_ACCESS",
  "HR_ACCESS",
  "ADMISSIONS_ACCESS",
  "SIS_ACCESS",
  "TEACHER_ACCESS",
  "PARENT_ACCESS",
  "STUDENT_ACCESS",
  "USER_MANAGEMENT_ACCESS",
  "SYSTEM_ADMIN_ACCESS",
  "AUDIT_ACCESS",
  "REPORTING_ACCESS",
] as const;

export type CatalogPermission = (typeof PERMISSION_CATALOG)[number];

export type CatalogPermissionDefinition = {
  readonly id: CatalogPermission;
  readonly label: string;
  readonly description: string;
};

export const PERMISSION_CATALOG_DEFINITIONS: {
  readonly [K in CatalogPermission]: CatalogPermissionDefinition & { readonly id: K };
} = {
  JAG_ACCESS: {
    id: "JAG_ACCESS",
    label: "JAG Access",
    description:
      "Platform-level access to The JAG™ (Founder / platform steward). Not for customer org admins.",
  },
  JAG_PLATFORM_ADMIN: {
    id: "JAG_PLATFORM_ADMIN",
    label: "JAG Platform Admin",
    description:
      "JAG platform control-plane administration across customer organizations.",
  },
  JAG_ORG_ACCESS: {
    id: "JAG_ORG_ACCESS",
    label: "JAG Organization Access",
    description:
      "Org-scoped JAG workspace access for a customer organization administrator.",
  },
  ACADEMYOS_ACCESS: {
    id: "ACADEMYOS_ACCESS",
    label: "AcademyOS Access",
    description: "Access to the AcademyOS application and school operations.",
  },
  FINANCE_ACCESS: {
    id: "FINANCE_ACCESS",
    label: "Finance Access",
    description: "Tuition, billing, and financial operations access.",
  },
  BANKING_ACCESS: {
    id: "BANKING_ACCESS",
    label: "Banking Access",
    description: "Banking, cash, and reconciliation access.",
  },
  ACCOUNTING_ACCESS: {
    id: "ACCOUNTING_ACCESS",
    label: "Accounting Access",
    description: "General ledger, accounting close, and financial accounting access.",
  },
  PAYROLL_ACCESS: {
    id: "PAYROLL_ACCESS",
    label: "Payroll Access",
    description: "Payroll run and payroll financial operations access.",
  },
  HR_ACCESS: {
    id: "HR_ACCESS",
    label: "HR Access",
    description: "Workforce, recruiting, and human resources access.",
  },
  ADMISSIONS_ACCESS: {
    id: "ADMISSIONS_ACCESS",
    label: "Admissions Access",
    description: "Admissions pipeline and enrollment access.",
  },
  SIS_ACCESS: {
    id: "SIS_ACCESS",
    label: "SIS Access",
    description: "Student information system and student records access.",
  },
  TEACHER_ACCESS: {
    id: "TEACHER_ACCESS",
    label: "Teacher Access",
    description: "Teacher workspace and instructional tools access.",
  },
  PARENT_ACCESS: {
    id: "PARENT_ACCESS",
    label: "Parent Access",
    description: "Parent portal access.",
  },
  STUDENT_ACCESS: {
    id: "STUDENT_ACCESS",
    label: "Student Access",
    description: "Student portal access.",
  },
  USER_MANAGEMENT_ACCESS: {
    id: "USER_MANAGEMENT_ACCESS",
    label: "User Management Access",
    description: "User directory, roles, and identity administration access.",
  },
  SYSTEM_ADMIN_ACCESS: {
    id: "SYSTEM_ADMIN_ACCESS",
    label: "System Admin Access",
    description: "Platform configuration, licensing, and system administration access.",
  },
  AUDIT_ACCESS: {
    id: "AUDIT_ACCESS",
    label: "Audit Access",
    description: "Security and audit log visibility access.",
  },
  REPORTING_ACCESS: {
    id: "REPORTING_ACCESS",
    label: "Reporting Access",
    description: "Global reporting and board/report surfaces access.",
  },
};

/**
 * Legacy catalog keys still accepted by authorize()/hasPermission().
 * Prefer the Sprint 004 official keys above.
 */
export const CATALOG_PERMISSION_ALIASES = {
  SYSTEM_CONFIGURATION_ACCESS: "SYSTEM_ADMIN_ACCESS",
  AUDIT_LOG_ACCESS: "AUDIT_ACCESS",
} as const satisfies Record<string, CatalogPermission>;

export type LegacyCatalogPermission = keyof typeof CATALOG_PERMISSION_ALIASES;

export function isCatalogPermission(value: string): value is CatalogPermission {
  return (PERMISSION_CATALOG as readonly string[]).includes(value);
}

export function isLegacyCatalogPermission(value: string): value is LegacyCatalogPermission {
  return Object.prototype.hasOwnProperty.call(CATALOG_PERMISSION_ALIASES, value);
}

/** Resolve official catalog permission (applies legacy aliases). */
export function resolveCatalogPermission(
  value: string
): CatalogPermission | null {
  if (isCatalogPermission(value)) return value;
  if (isLegacyCatalogPermission(value)) return CATALOG_PERMISSION_ALIASES[value];
  return null;
}

export function getCatalogPermission(id: CatalogPermission): CatalogPermissionDefinition {
  return PERMISSION_CATALOG_DEFINITIONS[id];
}

export function catalogPermissionIds(): readonly CatalogPermission[] {
  return PERMISSION_CATALOG;
}
