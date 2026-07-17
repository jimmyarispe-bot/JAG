/**
 * Map AcademyOS normalized cache → soft signals for existing intelligence domains.
 * Does not create domains or modify intelligence packages — only produces light inputs /
 * display metrics consumed by ECC loaders via createIntelligenceService().
 */

import { academyOsStore, type AcademyOsStoreSnapshot } from "./store";

export type AcademyOsIntelligenceFeed = {
  sourceSystem: "academyos";
  live: true;
  syncedAt: string;
  organizationId: string;
  counts: {
    students: number;
    guardians: number;
    employees: number;
    teachers: number;
    enrollments: number;
    classes: number;
    campuses: number;
    openTasks: number;
  };
  attendanceRate: number | null;
  financial: {
    revenue: number | null;
    expenses: number | null;
    net: number | null;
    cash: number | null;
    tuitionOutstanding: number | null;
  };
  workforceScore: number;
  enrollmentScore: number;
  operationsScore: number;
  financialScore: number;
  organizationHealthScore: number;
  briefBullets: string[];
  timeline: Array<{ id: string; title: string; subtitle: string; at: string }>;
  /** Soft lights compatible with wisdom/domain soft-read fields (0–100 style). */
  softLights: {
    humanCapital: { healthScore: { value: number }; humanCapitalScore: { value: number } };
    customer: { healthScore: { value: number }; customerScore: { value: number } };
    operations: { healthScore: { value: number }; operationsScore: { value: number } };
    financialSignal: { healthScore: number; cash: number | null };
  };
};

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n * 10) / 10));
}

export function buildAcademyOsIntelligenceFeed(
  snapshot: AcademyOsStoreSnapshot
): AcademyOsIntelligenceFeed | null {
  if (!snapshot.records.length || !snapshot.syncedAt) return null;

  const students = snapshot.byType.student?.length ?? 0;
  const guardians = snapshot.byType.guardian?.length ?? 0;
  const employees = snapshot.byType.employee?.length ?? 0;
  const teachers = snapshot.byType.teacher?.length ?? 0;
  const enrollments = snapshot.byType.enrollment?.length ?? 0;
  const classes = snapshot.byType.class?.length ?? 0;
  const campuses = snapshot.byType.campus?.length ?? 0;
  const openTasks =
    snapshot.byType.task?.filter((t) => t.attributes.status === "open").length ?? 0;

  const attendanceRows = snapshot.byType.attendance ?? [];
  const attendanceRate =
    attendanceRows.length > 0
      ? attendanceRows.reduce((sum, row) => sum + Number(row.attributes.rate ?? 0), 0) /
        attendanceRows.length
      : null;

  const financial = snapshot.byType.financial_summary?.[0]?.attributes;
  const tuition = snapshot.byType.tuition?.[0]?.attributes;
  const payroll = snapshot.byType.payroll_summary?.[0]?.attributes;

  const enrollmentScore = clamp(55 + enrollments * 6 + students * 3);
  const workforceScore = clamp(50 + (employees + teachers) * 5);
  const operationsScore = clamp(
    50 + (attendanceRate ?? 0.9) * 40 + classes * 2 - openTasks * 3
  );
  const financialScore = clamp(
    55 +
      (Number(financial?.net ?? 0) > 0 ? 15 : 0) +
      (Number(tuition?.outstanding ?? 1) > 0 ? 5 : 10)
  );
  const organizationHealthScore = clamp(
    (enrollmentScore + workforceScore + operationsScore + financialScore) / 4
  );

  const briefBullets = [
    `AcademyOS sync active — ${students} students, ${enrollments} enrollments across ${campuses} campuses.`,
    `Workforce posture: ${teachers} teachers and ${employees} staff from AcademyOS HRIS.`,
    attendanceRate != null
      ? `Attendance rate ${(attendanceRate * 100).toFixed(1)}% from latest AcademyOS attendance facts.`
      : "Attendance facts pending in AcademyOS sync.",
    financial
      ? `Financial summary: net ${Number(financial.net).toLocaleString()} · cash ${Number(financial.cash).toLocaleString()}.`
      : "Financial summary pending.",
    openTasks > 0
      ? `${openTasks} open operational task(s) from AcademyOS.`
      : "No open AcademyOS operational tasks.",
  ];

  const timeline = [
    {
      id: "aos-sync",
      title: "AcademyOS operational sync",
      subtitle: `${snapshot.records.length} records normalized into JAG`,
      at: snapshot.syncedAt,
    },
    ...attendanceRows.slice(0, 2).map((row) => ({
      id: row.id,
      title: String(row.attributes.name ?? "Attendance update"),
      subtitle: `Campus ${row.campusId ?? "org"} · rate ${Number(row.attributes.rate ?? 0).toFixed(3)}`,
      at: row.syncedAt,
    })),
    ...(snapshot.byType.communication ?? []).slice(0, 1).map((row) => ({
      id: row.id,
      title: String(row.attributes.name ?? "Communication"),
      subtitle: String(row.attributes.channel ?? "channel"),
      at: String(row.attributes.sentAt ?? row.syncedAt),
    })),
  ];

  return {
    sourceSystem: "academyos",
    live: true,
    syncedAt: snapshot.syncedAt,
    organizationId: snapshot.organizationId,
    counts: {
      students,
      guardians,
      employees,
      teachers,
      enrollments,
      classes,
      campuses,
      openTasks,
    },
    attendanceRate,
    financial: {
      revenue: financial ? Number(financial.revenue) : null,
      expenses: financial ? Number(financial.expenses) : null,
      net: financial ? Number(financial.net) : null,
      cash: financial ? Number(financial.cash) : null,
      tuitionOutstanding: tuition ? Number(tuition.outstanding) : null,
    },
    workforceScore,
    enrollmentScore,
    operationsScore,
    financialScore,
    organizationHealthScore,
    briefBullets,
    timeline,
    softLights: {
      humanCapital: {
        healthScore: { value: workforceScore },
        humanCapitalScore: { value: workforceScore },
      },
      customer: {
        healthScore: { value: enrollmentScore },
        customerScore: { value: enrollmentScore },
      },
      operations: {
        healthScore: { value: operationsScore },
        operationsScore: { value: operationsScore },
      },
      financialSignal: {
        healthScore: financialScore,
        cash: financial ? Number(financial.cash) : payroll ? Number(payroll.totalCompensation) : null,
      },
    },
  };
}

export function getAcademyOsFeed(organizationId: string): AcademyOsIntelligenceFeed | null {
  const snapshot = academyOsStore.get(organizationId);
  if (!snapshot) return null;
  return buildAcademyOsIntelligenceFeed(snapshot);
}
