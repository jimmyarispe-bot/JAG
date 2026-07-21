/**
 * Education → executive intelligence soft feed (RC-3.06).
 */

import { computeEducationSignals } from "@/lib/platform/integrations/connectors/education/intelligence/signals";
import { educationStore } from "@/lib/platform/integrations/connectors/education/services/store";

export type EducationExecutiveFeed = {
  sourceSystem: "education";
  live: true;
  syncedAt: string;
  organizationId: string;
  providersConnected: string[];
  education: {
    activeStudents: number;
    attendanceRate: number;
    academicPerformance: number;
    studentHealth: number;
    teacherWorkload: number;
  };
  scholarship: {
    awardTotal: number;
    awardCount: number;
    coveragePct: number;
  };
  briefBullets: string[];
  softLights: {
    opportunity: { healthScore: { value: number }; opportunityScore: { value: number } };
    risk: { healthScore: { value: number }; riskScore: { value: number } };
  };
};

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n * 10) / 10));
}

export function buildEducationExecutiveFeed(
  organizationId: string
): EducationExecutiveFeed | null {
  const records = educationStore.allRecords(organizationId);
  if (!records.length) return null;

  const signals = computeEducationSignals(records, organizationId);
  const snaps = educationStore.listForOrganization(organizationId);
  const syncedAt = snaps[0]?.syncedAt ?? new Date().toISOString();

  const opportunityScore = clamp(
    50 +
      signals.academicPerformance * 0.25 +
      (signals.attendanceRate >= 90 ? 12 : 0) +
      (signals.scholarshipAwardTotal > 0 ? 8 : 0)
  );
  const riskScore = clamp(
    signals.atRiskStudents * 18 +
      (signals.attendanceRate < 80 ? 20 : 0) +
      (signals.teacherWorkload > 70 ? 15 : 0)
  );

  return {
    sourceSystem: "education",
    live: true,
    syncedAt,
    organizationId,
    providersConnected: snaps.map((s) => s.provider),
    education: {
      activeStudents: signals.activeStudents,
      attendanceRate: signals.attendanceRate,
      academicPerformance: signals.academicPerformance,
      studentHealth: signals.studentHealth,
      teacherWorkload: signals.teacherWorkload,
    },
    scholarship: {
      awardTotal: signals.scholarshipAwardTotal,
      awardCount: signals.scholarshipAwardCount,
      coveragePct: signals.scholarshipCoveragePct,
    },
    briefBullets: [
      `${signals.activeStudents} active student(s) · attendance ${signals.attendanceRate}%.`,
      `Academic performance ${signals.academicPerformance}% · student health ${signals.studentHealth}.`,
      `Teacher workload ${signals.teacherWorkload} across ${signals.teacherCount} teacher(s).`,
      signals.scholarshipAwardCount > 0
        ? `Scholarship awards $${signals.scholarshipAwardTotal.toLocaleString()} (${signals.scholarshipCoveragePct}% coverage).`
        : "No scholarship awards soft-read yet — connect Scholarship Systems.",
    ],
    softLights: {
      opportunity: {
        healthScore: { value: opportunityScore },
        opportunityScore: { value: opportunityScore },
      },
      risk: {
        healthScore: { value: 100 - Math.min(riskScore, 90) },
        riskScore: { value: riskScore },
      },
    },
  };
}

export function getEducationExecutiveFeed(
  organizationId: string
): EducationExecutiveFeed | null {
  return buildEducationExecutiveFeed(organizationId);
}
