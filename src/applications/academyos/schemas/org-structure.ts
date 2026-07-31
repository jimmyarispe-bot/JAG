import { f, perms, schema } from "@/applications/academyos/schemas/_helpers";
import type { PlatformSchema } from "@/lib/platform/schema";

export const ORG_STRUCTURE_SCHEMAS: PlatformSchema[] = [
  schema({
    entityType: "Organization",
    label: "Organization",
    fields: [
      f.text("displayName", "Name", true),
      f.text("legalName", "Legal name"),
      f.email("primaryEmail", "Primary email"),
      f.select("status", "Status", true),
    ],
    permissions: perms("org", ["read", "update", "export"]),
  }),
  schema({
    entityType: "School",
    label: "School",
    fields: [
      f.text("displayName", "School name", true),
      f.ref("organizationId", "Organization", "Organization", true),
      f.text("code", "School code", true),
      f.select("status", "Status", true),
    ],
    permissions: perms("schools", ["read", "create", "update", "export"]),
    forms: [{ formId: "academyos.school.create", role: "create" }],
    relationships: [
      { key: "organization", targetEntityType: "Organization", cardinality: "one" },
    ],
  }),
  schema({
    entityType: "Campus",
    label: "Campus",
    fields: [
      f.text("displayName", "Campus name", true),
      f.ref("schoolId", "School", "School", true),
      f.text("address", "Address"),
      f.select("status", "Status", true),
    ],
    permissions: perms("schools", ["read", "create", "update"]),
  }),
  schema({
    entityType: "Program",
    label: "Program",
    fields: [
      f.text("displayName", "Program name", true),
      f.ref("schoolId", "School", "School"),
      f.text("code", "Code"),
      f.select("status", "Status", true),
    ],
    permissions: perms("programs", ["read", "create", "update", "export"]),
    forms: [{ formId: "academyos.program.create", role: "create" }],
  }),
  schema({
    entityType: "AcademicYear",
    label: "Academic Year",
    fields: [
      f.text("displayName", "Year label", true),
      f.ref("schoolId", "School", "School"),
      f.date("startDate", "Start", true),
      f.date("endDate", "End", true),
      f.bool("isCurrent", "Current year"),
    ],
    permissions: perms("academics", ["read", "update"]),
  }),
  schema({
    entityType: "Term",
    label: "Term",
    fields: [
      f.text("displayName", "Term name", true),
      f.ref("academicYearId", "Academic year", "AcademicYear", true),
      f.date("startDate", "Start", true),
      f.date("endDate", "End", true),
      f.select("status", "Status", true),
    ],
    permissions: perms("academics", ["read", "update"]),
  }),
  schema({
    entityType: "Classroom",
    label: "Classroom",
    fields: [
      f.text("displayName", "Classroom name", true),
      f.ref("campusId", "Campus", "Campus"),
      f.ref("schoolId", "School", "School", true),
      f.number("capacity", "Capacity"),
      f.text("code", "Code", true),
    ],
    permissions: perms("scheduling", ["read", "update"]),
  }),
  schema({
    entityType: "Room",
    label: "Room",
    fields: [
      f.text("displayName", "Room name", true),
      f.text("code", "Room code", true),
      f.ref("schoolId", "School", "School", true),
      f.number("capacity", "Capacity"),
    ],
    permissions: perms("scheduling", ["read", "update"]),
  }),
];
