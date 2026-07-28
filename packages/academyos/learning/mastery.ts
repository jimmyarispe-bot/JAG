import { randomUUID } from "node:crypto";
import { getStudent, upsertStudent } from "../sis/store";
import { projectAcademyEntityToTwin } from "../twin/project";
import { emitLearningEvent } from "./events";
import { isMasteryLevel, validateProgression } from "./mastery-scales";
import {
  appendMasteryHistory,
  getMastery,
  getMasteryScale,
  listMastery,
  listMasteryHistory,
  setMasteryScale,
  upsertMastery,
} from "./store";
import type {
  AcademyProgressionDomain,
  MasteryLevel,
  MasteryRecord,
  MasteryScaleConfig,
} from "./types";
import { MASTERY_LEVELS } from "./types";

function syncSisAcademicLevels(
  organizationId: string,
  studentId: string,
  domain: AcademyProgressionDomain | null | undefined,
  level: number | null | undefined,
  step: number | null | undefined
): void {
  if (!domain || level == null) return;
  const student = getStudent(organizationId, studentId);
  if (!student) return;
  const label =
    domain === "Structured Literacy" && step != null
      ? `Level ${level} Step ${step}`
      : `Level ${level}`;
  const academic = { ...student.academic };
  if (domain === "Reading") academic.readingLevel = label;
  if (domain === "Writing") academic.writingLevel = label;
  if (domain === "Math") academic.mathLevel = label;
  if (domain === "Structured Literacy") {
    academic.structuredLiteracyLevel = label;
  }
  upsertStudent({
    ...student,
    academic,
    updatedAt: new Date().toISOString(),
  });
}

export function createMasteryService() {
  return {
    getScale: getMasteryScale,

    configureScale(
      organizationId: string,
      config: MasteryScaleConfig
    ): MasteryScaleConfig {
      return setMasteryScale(organizationId, Object.freeze(config));
    },

    update(input: {
      organizationId: string;
      studentId: string;
      objectiveId: string;
      curriculumId?: string | null;
      level: MasteryLevel;
      domain?: AcademyProgressionDomain | null;
      progressionLevel?: number | null;
      progressionStep?: number | null;
      assessmentId?: string | null;
      actor: string;
    }): MasteryRecord | { error: string } {
      if (!getStudent(input.organizationId, input.studentId)) {
        return { error: "Student not found." };
      }
      if (!isMasteryLevel(input.level)) {
        return { error: "Invalid mastery level." };
      }
      const scale = getMasteryScale(input.organizationId);
      if (input.domain) {
        const err = validateProgression(
          scale,
          input.domain,
          input.progressionLevel ?? null,
          input.progressionStep ?? null
        );
        if (err) return { error: err };
      }

      const previous = getMastery(
        input.organizationId,
        input.studentId,
        input.objectiveId
      );
      const now = new Date().toISOString();
      const id = previous?.id ?? randomUUID();
      const twinId =
        previous?.twinEntityId ??
        projectAcademyEntityToTwin({
          organizationId: input.organizationId,
          academyEntity: "Progress Snapshot",
          twinEntityType: "Document",
          id,
          label: `Mastery ${input.objectiveId}`,
          kind: "mastery_record",
          actor: input.actor,
        });

      const record = upsertMastery({
        id,
        organizationId: input.organizationId,
        studentId: input.studentId,
        objectiveId: input.objectiveId,
        curriculumId: input.curriculumId ?? previous?.curriculumId ?? null,
        level: input.level,
        domain: input.domain ?? previous?.domain ?? null,
        progressionLevel:
          input.progressionLevel !== undefined
            ? input.progressionLevel
            : (previous?.progressionLevel ?? null),
        progressionStep:
          input.progressionStep !== undefined
            ? input.progressionStep
            : (previous?.progressionStep ?? null),
        previousLevel: previous?.level ?? null,
        updatedAt: now,
        updatedBy: input.actor,
        twinEntityId: twinId,
      });

      appendMasteryHistory({
        id: randomUUID(),
        organizationId: input.organizationId,
        studentId: input.studentId,
        objectiveId: input.objectiveId,
        fromLevel: previous?.level ?? null,
        toLevel: input.level,
        progressionLevel: record.progressionLevel,
        progressionStep: record.progressionStep,
        recordedAt: now,
        recordedBy: input.actor,
        assessmentId: input.assessmentId ?? null,
      });

      syncSisAcademicLevels(
        input.organizationId,
        input.studentId,
        record.domain,
        record.progressionLevel,
        record.progressionStep
      );

      emitLearningEvent({
        organizationId: input.organizationId,
        entityType: "MasteryRecord",
        entityId: id,
        eventType: "mastery_updated",
        actor: input.actor,
        metadata: {
          studentId: input.studentId,
          level: input.level,
          objectiveId: input.objectiveId,
        },
      });
      return record;
    },

    list: listMastery,
    history: listMasteryHistory,

    distribution(organizationId: string): Record<MasteryLevel, number> {
      const dist = Object.fromEntries(
        MASTERY_LEVELS.map((l) => [l, 0])
      ) as Record<MasteryLevel, number>;
      for (const m of listMastery(organizationId)) {
        dist[m.level] += 1;
      }
      return dist;
    },
  };
}
