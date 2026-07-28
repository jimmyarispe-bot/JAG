import { listStudents } from "../sis/store";
import { masteryRank } from "./mastery-scales";
import {
  listAssessments,
  listInterventions,
  listMastery,
  listMasteryHistory,
} from "./store";
import type { LearningProgressSummary, MasteryLevel } from "./types";
import { MASTERY_LEVELS } from "./types";
import { createMasteryService } from "./mastery";

export function buildLearningProgressSummary(
  organizationId: string
): LearningProgressSummary {
  const students = listStudents(organizationId);
  const mastery = listMastery(organizationId);
  const assessments = listAssessments(organizationId);
  const interventions = listInterventions(organizationId).filter(
    (i) => i.status === "Active" || i.status === "Review Due"
  );
  const history = listMasteryHistory(organizationId);

  const studentsWithMastered = new Set(
    mastery
      .filter((m) => m.level === "Mastered" || m.level === "Proficient")
      .map((m) => m.studentId)
  );

  const studentsNeedingIntervention = new Set(
    interventions.map((i) => i.studentId)
  ).size;

  let positive = 0;
  let totalChanges = 0;
  for (const h of history) {
    const from = h.fromLevel ? masteryRank(h.fromLevel) : -1;
    const to = masteryRank(h.toLevel);
    totalChanges += 1;
    if (to > from) positive += 1;
  }
  const growthTrendPercent =
    totalChanges === 0
      ? 0
      : Math.round((positive / totalChanges) * 1000) / 10;

  const studentsWithAssessments = new Set(assessments.map((a) => a.studentId))
    .size;
  const assessmentCompletionRate =
    students.length === 0
      ? 100
      : Math.round((studentsWithAssessments / students.length) * 1000) / 10;

  const literacyRows = mastery.filter(
    (m) =>
      m.domain === "Reading" ||
      m.domain === "Writing" ||
      m.domain === "Structured Literacy"
  );
  const literacyProgressionAverage =
    literacyRows.length === 0
      ? 0
      : Math.round(
          (literacyRows.reduce((a, m) => a + (m.progressionLevel ?? 0), 0) /
            literacyRows.length) *
            10
        ) / 10;

  const graduationReadinessAverage =
    students.length === 0
      ? 0
      : Math.round(
          (students.reduce((a, s) => {
            const total = s.academic.graduationRequirementsTotal || 1;
            return (
              a +
              (s.academic.graduationRequirementsMet / total) * 100
            );
          }, 0) /
            students.length) *
            10
        ) / 10;

  const programOutcomes: Record<string, number> = {};
  for (const s of students) {
    const mastered = mastery.filter(
      (m) =>
        m.studentId === s.id &&
        (m.level === "Mastered" || m.level === "Proficient")
    ).length;
    programOutcomes[s.program] = (programOutcomes[s.program] ?? 0) + mastered;
  }

  return {
    organizationId,
    studentsMasteringObjectives: studentsWithMastered.size,
    studentsNeedingIntervention,
    growthTrendPercent,
    assessmentCompletionRate,
    literacyProgressionAverage,
    graduationReadinessAverage,
    programOutcomes: Object.freeze(programOutcomes),
    masteryDistribution: Object.freeze(
      createMasteryService().distribution(organizationId)
    ) as Readonly<Record<MasteryLevel, number>>,
  };
}

export function emptyMasteryDistribution(): Record<MasteryLevel, number> {
  return Object.fromEntries(MASTERY_LEVELS.map((l) => [l, 0])) as Record<
    MasteryLevel,
    number
  >;
}
