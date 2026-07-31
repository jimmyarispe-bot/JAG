import type { PlatformEndpoint } from "@/lib/platform/api";

function endpoint(input: {
  id: string;
  method: PlatformEndpoint["method"];
  path: string;
  entityType: string;
  schemaId: string;
  permission: string;
  summary: string;
}): PlatformEndpoint {
  return {
    id: input.id,
    applicationId: "academyos",
    entityType: input.entityType,
    method: input.method,
    path: input.path,
    requestSchema:
      input.method === "GET" || input.method === "HEAD"
        ? null
        : { schemaId: input.schemaId },
    responseSchema: { schemaId: input.schemaId },
    permissions: [{ action: "invoke", permission: input.permission }],
    version: "1.1.0",
    summary: input.summary,
    tags: ["academyos"],
    metadata: { application: "academyos" },
  };
}

/**
 * Registered API contracts (Phase 1 foundation).
 * Planned-but-unregistered contracts live in `catalog.ts`.
 */
export const ACADEMYOS_ENDPOINTS: PlatformEndpoint[] = [
  endpoint({
    id: "academyos.students.list",
    method: "GET",
    path: "/api/v1/academyos/students",
    entityType: "Student",
    schemaId: "academyos.student",
    permission: "academyos.students.read",
    summary: "List students",
  }),
  endpoint({
    id: "academyos.students.create",
    method: "POST",
    path: "/api/v1/academyos/students",
    entityType: "Student",
    schemaId: "academyos.student",
    permission: "academyos.students.create",
    summary: "Create student",
  }),
  endpoint({
    id: "academyos.schools.list",
    method: "GET",
    path: "/api/v1/academyos/schools",
    entityType: "School",
    schemaId: "academyos.school",
    permission: "academyos.schools.read",
    summary: "List schools",
  }),
  endpoint({
    id: "academyos.enrollment.create",
    method: "POST",
    path: "/api/v1/academyos/enrollments",
    entityType: "Enrollment",
    schemaId: "academyos.enrollment",
    permission: "academyos.enrollment.create",
    summary: "Create enrollment",
  }),
  endpoint({
    id: "academyos.attendance.create",
    method: "POST",
    path: "/api/v1/academyos/attendance",
    entityType: "AttendanceRecord",
    schemaId: "academyos.attendance-record",
    permission: "academyos.attendance.create",
    summary: "Record attendance",
  }),
  endpoint({
    id: "academyos.employees.list",
    method: "GET",
    path: "/api/v1/academyos/employees",
    entityType: "Employee",
    schemaId: "academyos.employee",
    permission: "academyos.hr.read",
    summary: "List employees",
  }),
  endpoint({
    id: "academyos.invoices.create",
    method: "POST",
    path: "/api/v1/academyos/invoices",
    entityType: "Invoice",
    schemaId: "academyos.invoice",
    permission: "academyos.finance.create",
    summary: "Create invoice",
  }),
  endpoint({
    id: "academyos.scholarships.create",
    method: "POST",
    path: "/api/v1/academyos/scholarships",
    entityType: "Scholarship",
    schemaId: "academyos.scholarship",
    permission: "academyos.scholarships.create",
    summary: "Create scholarship",
  }),
];
