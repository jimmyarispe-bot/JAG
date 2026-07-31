/**
 * AcademyOS permission role packs — configuration only.
 * Maps logical Academy roles onto permission keys consumed by IAM checks.
 * Does not modify platform IAM registries.
 */

export type AcademyPermissionAction =
  | "read"
  | "create"
  | "update"
  | "approve"
  | "archive"
  | "export"
  | "administer";

export type AcademyPermissionRoleId =
  | "CEO"
  | "EXECUTIVE_DIRECTOR"
  | "SCHOOL_LEADER"
  | "TEACHER"
  | "PARENT"
  | "STUDENT"
  | "EMPLOYEE";

export type AcademyPermissionRolePack = {
  id: AcademyPermissionRoleId;
  label: string;
  description: string;
  /** Permission keys declared for AcademyOS artifacts / future IAM grants. */
  permissions: string[];
  /**
   * Explicit action matrix by resource prefix.
   * Actions: read · create · update · approve · archive · export · administer
   */
  matrix: Record<string, AcademyPermissionAction[]>;
};

const ALL: AcademyPermissionAction[] = [
  "read",
  "create",
  "update",
  "approve",
  "archive",
  "export",
  "administer",
];

function keysFromMatrix(matrix: Record<string, AcademyPermissionAction[]>): string[] {
  const keys: string[] = ["academyos.access"];
  for (const [resource, actions] of Object.entries(matrix)) {
    for (const action of actions) {
      keys.push(`academyos.${resource}.${action}`);
    }
  }
  return keys;
}

const CEO_MATRIX: Record<string, AcademyPermissionAction[]> = {
  org: ALL,
  schools: ALL,
  programs: ALL,
  academics: ALL,
  students: ALL,
  families: ALL,
  guardians: ALL,
  admissions: ALL,
  enrollment: ALL,
  learning: ALL,
  attendance: ALL,
  assessments: ALL,
  behavior: ALL,
  compliance: ALL,
  medical: ALL,
  finance: ALL,
  scholarships: ALL,
  hr: ALL,
  staff: ALL,
  operations: ALL,
  communications: ALL,
  documents: ALL,
  scheduling: ALL,
  reports: ["read", "export", "administer"],
  admin: ["administer"],
};

const EXEC_MATRIX: Record<string, AcademyPermissionAction[]> = {
  schools: ["read", "update", "export"],
  programs: ["read", "create", "update", "export"],
  students: ["read", "create", "update", "approve", "archive", "export"],
  families: ["read", "create", "update", "export"],
  guardians: ["read", "create", "update"],
  admissions: ["read", "create", "update", "approve", "export"],
  enrollment: ["read", "create", "update", "approve", "export"],
  learning: ["read", "export"],
  attendance: ["read", "export"],
  assessments: ["read", "export"],
  behavior: ["read", "approve", "export"],
  compliance: ["read", "approve", "export"],
  finance: ["read", "export"],
  scholarships: ["read", "approve", "export"],
  hr: ["read", "export"],
  staff: ["read", "export"],
  operations: ["read"],
  communications: ["read", "create", "approve"],
  documents: ["read", "export"],
  reports: ["read", "export"],
};

const LEADER_MATRIX: Record<string, AcademyPermissionAction[]> = {
  schools: ["read"],
  programs: ["read", "create", "update"],
  students: ["read", "create", "update", "approve", "archive", "export"],
  families: ["read", "create", "update"],
  guardians: ["read", "create", "update"],
  admissions: ["read", "create", "update", "approve"],
  enrollment: ["read", "create", "update", "approve"],
  learning: ["read", "create", "update", "export"],
  attendance: ["read", "create", "update", "export"],
  assessments: ["read", "create", "update", "export"],
  behavior: ["read", "create", "update", "approve"],
  compliance: ["read", "create", "update", "approve"],
  medical: ["read", "create", "update"],
  finance: ["read"],
  scholarships: ["read", "approve"],
  hr: ["read"],
  staff: ["read", "create", "update"],
  operations: ["read", "create", "update"],
  communications: ["read", "create", "update", "approve"],
  documents: ["read", "create", "update", "export"],
  scheduling: ["read", "update"],
  reports: ["read", "export"],
};

const TEACHER_MATRIX: Record<string, AcademyPermissionAction[]> = {
  students: ["read"],
  families: ["read"],
  guardians: ["read"],
  learning: ["read", "create", "update"],
  attendance: ["read", "create", "update", "export"],
  assessments: ["read", "create", "update", "export"],
  behavior: ["read", "create"],
  compliance: ["read"],
  medical: ["read"],
  communications: ["read", "create"],
  documents: ["read", "create"],
  scheduling: ["read"],
  reports: ["read"],
};

const PARENT_MATRIX: Record<string, AcademyPermissionAction[]> = {
  students: ["read"],
  families: ["read", "update"],
  guardians: ["read", "update"],
  enrollment: ["read"],
  learning: ["read"],
  attendance: ["read"],
  assessments: ["read"],
  finance: ["read"],
  scholarships: ["read"],
  communications: ["read", "create"],
  documents: ["read"],
  medical: ["read"],
};

const STUDENT_MATRIX: Record<string, AcademyPermissionAction[]> = {
  learning: ["read"],
  attendance: ["read"],
  assessments: ["read"],
  communications: ["read", "create"],
  documents: ["read"],
};

const EMPLOYEE_MATRIX: Record<string, AcademyPermissionAction[]> = {
  hr: ["read", "update"],
  staff: ["read"],
  scheduling: ["read"],
  communications: ["read"],
  documents: ["read", "create"],
};

function pack(
  id: AcademyPermissionRoleId,
  label: string,
  description: string,
  matrix: Record<string, AcademyPermissionAction[]>
): AcademyPermissionRolePack {
  return {
    id,
    label,
    description,
    matrix,
    permissions: keysFromMatrix(matrix),
  };
}

export const ACADEMYOS_PERMISSION_ROLE_PACKS: AcademyPermissionRolePack[] = [
  pack("CEO", "CEO", "Organization-wide Academy executive access", CEO_MATRIX),
  pack(
    "EXECUTIVE_DIRECTOR",
    "Executive Director",
    "Multi-school executive operations",
    EXEC_MATRIX
  ),
  pack("SCHOOL_LEADER", "School Leader", "Single-school leadership", LEADER_MATRIX),
  pack("TEACHER", "Teacher", "Classroom instruction and attendance", TEACHER_MATRIX),
  pack("PARENT", "Parent / Guardian", "Family portal access for linked students", PARENT_MATRIX),
  pack("STUDENT", "Student", "Learner self-service", STUDENT_MATRIX),
  pack("EMPLOYEE", "Employee", "Staff HR self-service", EMPLOYEE_MATRIX),
];

/** Flat permission catalog derived from role packs + workflow gates. */
export const ACADEMYOS_PERMISSION_KEYS: string[] = [
  ...new Set([
    ...ACADEMYOS_PERMISSION_ROLE_PACKS.flatMap((r) => r.permissions),
    "academyos.admissions.approve",
    "academyos.enrollment.approve",
    "academyos.behavior.approve",
    "academyos.scholarships.approve",
    "academyos.finance.approve",
    "academyos.hr.approve",
    "academyos.students.update",
    "academyos.hr.update",
    "academyos.admin",
  ]),
];
