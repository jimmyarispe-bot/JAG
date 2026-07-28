import { randomUUID } from "node:crypto";
import { getStudent } from "../sis/store";
import { projectAcademyEntityToTwin } from "../twin/project";
import { masteryRank } from "./mastery-scales";
import {
  listAssessments,
  listCurricula,
  listMastery,
  listMasteryHistory,
  listSnapshots,
  upsertSnapshot,
} from "./store";
import type { ProgressSnapshot } from "./types";

export function createProgressService() {
  return {
    snapshot(input: {
      organizationId: string;
      studentId: string;
      asOf?: string;
      actor: string;
    }): ProgressSnapshot | { error: string } {
      if (!getStudent(input.organizationId, input.studentId)) {
        return { error: "Student not found." };
      }
      const mastery = listMastery(input.organizationId, input.studentId);
      const publishedObjectives = listCurricula(input.organizationId)
        .filter((c) => c.status === "Published")
        .flatMap((c) => c.objectives);
      const totalObjectives = Math.max(
        publishedObjectives.length,
        mastery.length,
        1
      );
      const masteredCount = mastery.filter(
        (m) => m.level === "Mastered" || m.level === "Proficient"
      ).length;
      const masteryPercent = Math.round(
        (masteredCount / totalObjectives) * 1000
      ) / 10;

      const domainLevels: Record<
        string,
        { level: number | null; step: number | null }
      > = {};
      for (const m of mastery) {
        if (!m.domain) continue;
        domainLevels[m.domain] = {
          level: m.progressionLevel,
          step: m.progressionStep,
        };
      }

      const asOf = (input.asOf ?? new Date().toISOString()).slice(0, 10);
      const id = randomUUID();
      const twinId = projectAcademyEntityToTwin({
        organizationId: input.organizationId,
        academyEntity: "Progress Snapshot",
        twinEntityType: "Document",
        id,
        label: `Progress ${input.studentId} ${asOf}`,
        kind: "progress_snapshot",
        actor: input.actor,
      });

      return upsertSnapshot({
        id,
        organizationId: input.organizationId,
        studentId: input.studentId,
        asOf,
        masteredCount,
        totalObjectives,
        masteryPercent,
        domainLevels: Object.freeze(domainLevels),
        twinEntityId: twinId,
        createdAt: new Date().toISOString(),
      });
    },

    listSnapshots,

    /** Deterministic growth: net positive mastery rank changes in history. */
    growth(organizationId: string, studentId: string) {
      const history = listMasteryHistory(organizationId, studentId);
      let net = 0;
      for (const h of history) {
        const from = h.fromLevel ? masteryRank(h.fromLevel) : -1;
        const to = masteryRank(h.toLevel);
        net += to - from;
      }
      return {
        netLevelChanges: net,
        assessmentCount: listAssessments(organizationId, { studentId }).length,
        historyCount: history.length,
        snapshots: listSnapshots(organizationId, studentId),
      };
    },
  };
}
