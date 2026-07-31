import { f, perms, schema } from "@/applications/academyos/schemas/_helpers";
import type { PlatformSchema } from "@/lib/platform/schema";

export const PEOPLE_SCHEMAS: PlatformSchema[] = [
  schema({
    entityType: "Family",
    label: "Family",
    fields: [
      f.text("displayName", "Family name", true),
      f.email("primaryEmail", "Primary email"),
      f.phone("primaryPhone", "Primary phone"),
      f.select("status", "Status", true),
    ],
    permissions: perms("families", ["read", "create", "update", "export"]),
  }),
  schema({
    entityType: "Student",
    label: "Student",
    fields: [
      f.text("displayName", "Full name", true),
      f.text("firstName", "First name", true),
      f.text("lastName", "Last name", true),
      f.date("dateOfBirth", "Date of birth"),
      f.email("email", "Email"),
      f.ref("schoolId", "School", "School"),
      f.ref("familyId", "Family", "Family"),
      f.select("status", "Status", true),
    ],
    permissions: perms("students", ["read", "create", "update", "export"]),
    forms: [{ formId: "academyos.student.create", role: "create" }],
    workflows: [
      { workflowId: "academyos.admissions", role: "primary" },
      { workflowId: "academyos.student-lifecycle", role: "secondary" },
    ],
    intelligence: {
      searchableFields: ["displayName", "email"],
      reportableFields: ["displayName", "status", "schoolId"],
    },
  }),
  schema({
    entityType: "Guardian",
    label: "Guardian",
    fields: [
      f.text("displayName", "Full name", true),
      f.email("email", "Email", true),
      f.phone("phone", "Phone"),
      f.ref("familyId", "Family", "Family"),
      f.select("relationship", "Relationship", true),
    ],
    permissions: perms("guardians", ["read", "create", "update"]),
    forms: [{ formId: "academyos.guardian.create", role: "create" }],
  }),
  schema({
    entityType: "EmergencyContact",
    label: "Emergency Contact",
    fields: [
      f.text("displayName", "Full name", true),
      f.phone("phone", "Phone"),
      f.email("email", "Email"),
      f.ref("studentId", "Student", "Student", true),
      f.select("relationship", "Relationship", true),
      f.bool("priority", "Primary contact"),
    ],
    permissions: perms("students", ["read", "create", "update"]),
    forms: [{ formId: "academyos.emergency-contact.create", role: "create" }],
  }),
  schema({
    entityType: "Teacher",
    label: "Teacher",
    fields: [
      f.text("displayName", "Full name", true),
      f.email("email", "Email", true),
      f.ref("schoolId", "School", "School"),
      f.ref("employeeId", "Employee", "Employee"),
      f.select("status", "Status", true),
    ],
    permissions: perms("staff", ["read", "create", "update", "export"]),
    forms: [{ formId: "academyos.teacher.create", role: "create" }],
  }),
  schema({
    entityType: "Employee",
    label: "Employee",
    fields: [
      f.text("displayName", "Full name", true),
      f.email("email", "Email", true),
      f.select("jobTitle", "Job title"),
      f.ref("schoolId", "School", "School"),
      f.select("status", "Status", true),
      f.date("hireDate", "Hire date"),
    ],
    permissions: perms("hr", ["read", "create", "update", "approve", "export"]),
    forms: [{ formId: "academyos.employee.create", role: "create" }],
    workflows: [
      { workflowId: "academyos.hiring", role: "primary" },
      { workflowId: "academyos.hr-lifecycle", role: "secondary" },
    ],
  }),
  schema({
    entityType: "StaffAssignment",
    label: "Staff Assignment",
    fields: [
      f.ref("employeeId", "Employee", "Employee", true),
      f.ref("schoolId", "School", "School", true),
      f.ref("sectionId", "Section", "Section"),
      f.select("role", "Assignment role", true),
      f.date("startDate", "Start", true),
      f.date("endDate", "End"),
      f.select("status", "Status", true),
    ],
    permissions: perms("hr", ["read", "create", "update"]),
  }),
];
