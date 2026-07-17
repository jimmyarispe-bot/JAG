/**
 * AcademyOS system-of-record client.
 * Demo store ships production-shaped operational data for sync/tests.
 * Live adapters can implement the same interface without changing the connector contract.
 */

import type { AcademyOsObjectType, AcademyOsRawEntity } from "./entities";
import { ACADEMYOS_OBJECT_TYPES } from "./entities";

export interface AcademyOsClient {
  authenticate(apiKey: string): Promise<{ ok: boolean; error?: string }>;
  health(): Promise<{ ok: boolean; latencyMs: number }>;
  list(
    organizationId: string,
    objectType: AcademyOsObjectType,
    since?: string | null
  ): Promise<AcademyOsRawEntity[]>;
}

function entity(
  objectType: AcademyOsObjectType,
  id: string,
  organizationId: string,
  campusId: string | null,
  version: number,
  payload: Record<string, unknown>,
  updatedAt: string
): AcademyOsRawEntity {
  return {
    id,
    objectType,
    organizationId,
    campusId,
    updatedAt,
    version,
    payload: { ...payload, name: payload.name ?? payload.title ?? id },
  };
}

/** Deterministic demo SoR for AcademyOS — expandable without live network. */
export function createDemoAcademyOsClient(seed = "academyos-demo"): AcademyOsClient {
  const orgId = "org-academy-demo";
  const campusA = "campus-north";
  const campusB = "campus-south";
  const now = "2026-07-13T12:00:00.000Z";
  const earlier = "2026-07-12T08:00:00.000Z";

  const catalog: AcademyOsRawEntity[] = [
    entity("organization", orgId, orgId, null, 3, {
      name: "AcademyOS Demonstration Academy",
      legalName: "AcademyOS Demo Academy Inc.",
      status: "active",
    }, now),
    entity("campus", campusA, orgId, campusA, 2, {
      name: "North Campus",
      city: "Atlanta",
      capacity: 420,
    }, now),
    entity("campus", campusB, orgId, campusB, 2, {
      name: "South Campus",
      city: "Atlanta",
      capacity: 310,
    }, earlier),
    entity("program", "prog-hs", orgId, campusA, 1, {
      name: "High School Diploma",
      level: "secondary",
      seats: 180,
    }, now),
    entity("program", "prog-cte", orgId, campusB, 1, {
      name: "Career & Technical Education",
      level: "secondary",
      seats: 96,
    }, now),
    entity("student", "stu-1001", orgId, campusA, 5, {
      name: "Jordan Lee",
      firstName: "Jordan",
      lastName: "Lee",
      grade: "11",
      status: "active",
      enrollmentDate: "2025-08-12",
    }, now),
    entity("student", "stu-1002", orgId, campusA, 4, {
      name: "Sam Rivera",
      firstName: "Sam",
      lastName: "Rivera",
      grade: "10",
      status: "active",
      enrollmentDate: "2025-08-12",
    }, now),
    entity("student", "stu-1003", orgId, campusB, 3, {
      name: "Avery Chen",
      firstName: "Avery",
      lastName: "Chen",
      grade: "12",
      status: "active",
      enrollmentDate: "2024-08-10",
    }, earlier),
    entity("student", "stu-1004", orgId, campusB, 2, {
      name: "Morgan Patel",
      firstName: "Morgan",
      lastName: "Patel",
      grade: "9",
      status: "active",
      enrollmentDate: "2026-01-06",
    }, now),
    entity("guardian", "gua-2001", orgId, campusA, 2, {
      name: "Alex Lee",
      relationship: "parent",
      studentIds: ["stu-1001"],
      email: "alex.lee@example.com",
    }, now),
    entity("guardian", "gua-2002", orgId, campusB, 1, {
      name: "Casey Chen",
      relationship: "guardian",
      studentIds: ["stu-1003"],
      email: "casey.chen@example.com",
    }, earlier),
    entity("employee", "emp-3001", orgId, campusA, 3, {
      name: "Taylor Brooks",
      role: "operations",
      status: "active",
      department: "Administration",
    }, now),
    entity("employee", "emp-3002", orgId, campusB, 2, {
      name: "Riley Nguyen",
      role: "finance",
      status: "active",
      department: "Business Office",
    }, now),
    entity("teacher", "tch-4001", orgId, campusA, 4, {
      name: "Dr. Morgan Ellis",
      subject: "Mathematics",
      status: "active",
      fte: 1,
    }, now),
    entity("teacher", "tch-4002", orgId, campusA, 3, {
      name: "Jamie Ortiz",
      subject: "English",
      status: "active",
      fte: 1,
    }, now),
    entity("teacher", "tch-4003", orgId, campusB, 2, {
      name: "Chris Adeyemi",
      subject: "Career Tech",
      status: "active",
      fte: 0.8,
    }, earlier),
    entity("class", "cls-5001", orgId, campusA, 2, {
      name: "Algebra II",
      teacherId: "tch-4001",
      programId: "prog-hs",
      seats: 28,
      enrolled: 26,
    }, now),
    entity("class", "cls-5002", orgId, campusB, 2, {
      name: "Welding Fundamentals",
      teacherId: "tch-4003",
      programId: "prog-cte",
      seats: 18,
      enrolled: 16,
    }, now),
    entity("enrollment", "enr-6001", orgId, campusA, 2, {
      name: "Jordan Lee / Algebra II",
      studentId: "stu-1001",
      classId: "cls-5001",
      status: "active",
    }, now),
    entity("enrollment", "enr-6002", orgId, campusA, 2, {
      name: "Sam Rivera / Algebra II",
      studentId: "stu-1002",
      classId: "cls-5001",
      status: "active",
    }, now),
    entity("enrollment", "enr-6003", orgId, campusB, 1, {
      name: "Avery Chen / Welding",
      studentId: "stu-1003",
      classId: "cls-5002",
      status: "active",
    }, earlier),
    entity("attendance", "att-7001", orgId, campusA, 1, {
      name: "Attendance 2026-07-12",
      date: "2026-07-12",
      present: 248,
      absent: 12,
      tardy: 7,
      rate: 0.954,
    }, earlier),
    entity("attendance", "att-7002", orgId, campusB, 1, {
      name: "Attendance 2026-07-12",
      date: "2026-07-12",
      present: 176,
      absent: 9,
      tardy: 4,
      rate: 0.951,
    }, earlier),
    entity("session", "ses-8001", orgId, campusA, 1, {
      name: "Algebra II — Period 2",
      classId: "cls-5001",
      startsAt: "2026-07-13T14:00:00.000Z",
      endsAt: "2026-07-13T14:50:00.000Z",
      status: "scheduled",
    }, now),
    entity("tuition", "tui-9001", orgId, campusA, 2, {
      name: "FY26 Tuition schedule",
      amountDue: 1250000,
      amountCollected: 980000,
      outstanding: 270000,
      currency: "USD",
    }, now),
    entity("scholarship", "sch-9101", orgId, campusA, 1, {
      name: "Merit Scholars",
      awards: 42,
      totalAmount: 185000,
      currency: "USD",
    }, now),
    entity("payroll_summary", "pay-9201", orgId, null, 1, {
      name: "July payroll summary",
      period: "2026-07",
      headcount: 86,
      totalCompensation: 612000,
      currency: "USD",
    }, now),
    entity("financial_summary", "fin-9301", orgId, null, 2, {
      name: "YTD financial summary",
      revenue: 4_250_000,
      expenses: 3_980_000,
      net: 270_000,
      cash: 1_120_000,
      currency: "USD",
    }, now),
    entity("document", "doc-9401", orgId, campusA, 1, {
      name: "Student handbook 2026",
      category: "policy",
      status: "published",
    }, now),
    entity("task", "tsk-9501", orgId, campusA, 1, {
      name: "Complete enrollment audit",
      owner: "emp-3001",
      status: "open",
      dueDate: "2026-07-20",
    }, now),
    entity("communication", "com-9601", orgId, campusA, 1, {
      name: "Family newsletter — July",
      channel: "email",
      audience: "guardians",
      sentAt: earlier,
    }, earlier),
  ];

  // Touch seed so deterministic clients can vary later without API change
  void seed;

  return {
    async authenticate(apiKey) {
      if (!apiKey || apiKey === "invalid") {
        return { ok: false, error: "Invalid AcademyOS API key" };
      }
      return { ok: true };
    },
    async health() {
      return { ok: true, latencyMs: 12 };
    },
    async list(organizationId, objectType, since) {
      return catalog.filter((row) => {
        if (row.organizationId !== organizationId && organizationId !== "exec-demo-org") {
          // Map ECC demo org onto AcademyOS demo org
          if (organizationId !== orgId && row.organizationId !== orgId) return false;
        }
        // Accept exec-demo-org as alias for demo academy org
        const orgOk =
          row.organizationId === organizationId ||
          organizationId === "exec-demo-org" ||
          organizationId === orgId;
        if (!orgOk) return false;
        if (row.objectType !== objectType) return false;
        if (since && row.updatedAt < since) return false;
        return true;
      });
    },
  };
}

export function allAcademyOsObjectTypes(): AcademyOsObjectType[] {
  return [...ACADEMYOS_OBJECT_TYPES];
}
