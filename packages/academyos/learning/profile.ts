import { createSisAttendanceService } from "../sis/attendance";
import { getStudent, listSupportPlans } from "../sis/store";
import { createProgressService } from "./progress";
import {
  listAssessments,
  listInterventions,
  listMastery,
  listMasteryHistory,
  listObservations,
} from "./store";
import type {
  AcademyProgressionDomain,
  MasteryLevel,
  MasteryRecord,
  StudentLearningProfile,
} from "./types";

function domainView(
  mastery: readonly MasteryRecord[],
  domain: AcademyProgressionDomain
): { level: number | null; step: number | null; mastery: MasteryLevel | null } {
  const rows = mastery.filter((m) => m.domain === domain);
  if (rows.length === 0) {
    return { level: null, step: null, mastery: null };
  }
  const best = rows.reduce((a, b) =>
    (b.progressionLevel ?? 0) >= (a.progressionLevel ?? 0) ? b : a
  );
  return {
    level: best.progressionLevel,
    step: best.progressionStep,
    mastery: best.level,
  };
}

export function createLearningProfileService() {
  const progress = createProgressService();

  return {
    get(input: {
      organizationId: string;
      studentId: string;
    }): StudentLearningProfile | { error: string } {
      const student = getStudent(input.organizationId, input.studentId);
      if (!student) return { error: "Student not found." };

      const mastery = listMastery(input.organizationId, input.studentId);
      const growth = progress.growth(input.organizationId, input.studentId);
      const attendance = createSisAttendanceService().dashboard(
        input.organizationId
      );
      // Approximate correlation note from org present rate + student records
      const studentAttendance = createSisAttendanceService().list(
        input.organizationId,
        input.studentId
      );
      const presentLike = studentAttendance.filter((r) =>
        ["Present", "Remote Present", "Late"].includes(r.status)
      ).length;
      const presentRate =
        studentAttendance.length === 0
          ? attendance.monthlyPresentRate
          : Math.round((presentLike / studentAttendance.length) * 1000) / 10;

      const sl = domainView(mastery, "Structured Literacy");

      return {
        studentId: student.id,
        organizationId: input.organizationId,
        reading: domainView(mastery, "Reading"),
        writing: domainView(mastery, "Writing"),
        math: domainView(mastery, "Math"),
        structuredLiteracy: {
          level: sl.level,
          step: sl.step,
          mastery: sl.mastery,
        },
        currentMastery: mastery,
        assessments: listAssessments(input.organizationId, {
          studentId: input.studentId,
        }),
        observations: listObservations(input.organizationId, input.studentId),
        interventions: listInterventions(input.organizationId, {
          studentId: input.studentId,
        }),
        history: listMasteryHistory(input.organizationId, input.studentId),
        growth: {
          snapshots: growth.snapshots,
          netLevelChanges: growth.netLevelChanges,
        },
        attendanceCorrelation: {
          presentRate,
          note:
            presentRate < 90
              ? "Attendance may be limiting academic growth."
              : "Attendance supports consistent instructional access.",
        },
        supportPlanCount: listSupportPlans(
          input.organizationId,
          input.studentId
        ).filter((p) => p.status === "Active" || p.status === "Review Due")
          .length,
      };
    },
  };
}
