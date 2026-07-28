/**
 * Learning parent portal — mastery, assessments, interventions, goals.
 */

import { findStudentByParentToken } from "../sis/store";
import { createLearningProfileService } from "./profile";
import { listAssessments, listInterventions, listMasteryHistory } from "./store";

export function createLearningParentPortalService() {
  const profiles = createLearningProfileService();

  return {
    resolve(token: string) {
      const student = findStudentByParentToken(token);
      if (!student) return { error: "Invalid parent access token." as const };

      const profile = profiles.get({
        organizationId: student.organizationId,
        studentId: student.id,
      });
      if ("error" in profile) return { error: profile.error };

      const interventions = listInterventions(student.organizationId, {
        studentId: student.id,
      }).filter((i) => i.status === "Active" || i.status === "Review Due");

      return {
        masteryDashboard: {
          reading: profile.reading,
          writing: profile.writing,
          math: profile.math,
          structuredLiteracy: profile.structuredLiteracy,
        },
        assessmentHistory: listAssessments(student.organizationId, {
          studentId: student.id,
        }).map((a) => ({
          date: a.assessedOn,
          kind: a.kind,
          result: a.result,
          notes: a.notes,
        })),
        teacherFeedback: profile.observations.map((o) => ({
          date: o.assessedOn,
          body: o.body,
        })),
        learningGoals: profile.currentMastery
          .filter((m) => m.level !== "Mastered")
          .map((m) => ({
            objectiveId: m.objectiveId,
            current: m.level,
            domain: m.domain,
          })),
        interventionPlans: interventions.map((i) => ({
          kind: i.kind,
          goals: i.goals,
          status: i.status,
          reviewOn: i.reviewOn,
        })),
        progressTimeline: listMasteryHistory(
          student.organizationId,
          student.id
        ).map((h) => ({
          at: h.recordedAt,
          from: h.fromLevel,
          to: h.toLevel,
          objectiveId: h.objectiveId,
        })),
      };
    },
  };
}
