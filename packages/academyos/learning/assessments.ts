import { randomUUID } from "node:crypto";
import { recordStudentTimeline } from "../sis/audit";
import { getStudent } from "../sis/store";
import { projectAcademyEntityToTwin } from "../twin/project";
import { emitLearningEvent } from "./events";
import { isMasteryLevel } from "./mastery-scales";
import { createMasteryService } from "./mastery";
import {
  getCurriculum,
  listAssessments,
  upsertAssessment,
} from "./store";
import type { AssessmentKind, AssessmentRecord, MasteryLevel } from "./types";
import { ASSESSMENT_KINDS } from "./types";

export function createAssessmentService() {
  const mastery = createMasteryService();

  return {
    record(input: {
      organizationId: string;
      studentId: string;
      teacherId?: string | null;
      kind: AssessmentKind;
      assessedOn: string;
      objectiveId?: string | null;
      curriculumId?: string | null;
      result: MasteryLevel | string;
      notes?: string;
      evidenceUrls?: readonly string[];
      updateMastery?: boolean;
      domain?: Parameters<
        ReturnType<typeof createMasteryService>["update"]
      >[0]["domain"];
      progressionLevel?: number | null;
      progressionStep?: number | null;
      createdBy: string;
    }): AssessmentRecord | { error: string } {
      if (!getStudent(input.organizationId, input.studentId)) {
        return { error: "Student not found." };
      }
      if (!(ASSESSMENT_KINDS as readonly string[]).includes(input.kind)) {
        return { error: "Invalid assessment kind." };
      }
      if (input.curriculumId && !getCurriculum(input.organizationId, input.curriculumId)) {
        return { error: "Curriculum not found." };
      }

      const now = new Date().toISOString();
      const id = randomUUID();
      const twinId = projectAcademyEntityToTwin({
        organizationId: input.organizationId,
        academyEntity: "Assessment",
        twinEntityType: "Document",
        id,
        label: `${input.kind} ${input.assessedOn.slice(0, 10)}`,
        kind: "assessment",
        actor: input.createdBy,
        metadata: {
          studentId: input.studentId,
          result: String(input.result),
        },
      });

      const row = upsertAssessment({
        id,
        organizationId: input.organizationId,
        studentId: input.studentId,
        teacherId: input.teacherId ?? null,
        kind: input.kind,
        assessedOn: input.assessedOn.slice(0, 10),
        objectiveId: input.objectiveId ?? null,
        curriculumId: input.curriculumId ?? null,
        result: input.result,
        notes: input.notes ?? "",
        evidenceUrls: Object.freeze([...(input.evidenceUrls ?? [])]),
        twinEntityId: twinId,
        createdAt: now,
        createdBy: input.createdBy,
      });

      if (
        input.updateMastery !== false &&
        input.objectiveId &&
        isMasteryLevel(String(input.result))
      ) {
        mastery.update({
          organizationId: input.organizationId,
          studentId: input.studentId,
          objectiveId: input.objectiveId,
          curriculumId: input.curriculumId,
          level: input.result as MasteryLevel,
          domain: input.domain,
          progressionLevel: input.progressionLevel,
          progressionStep: input.progressionStep,
          assessmentId: id,
          actor: input.createdBy,
        });
      }

      recordStudentTimeline({
        organizationId: input.organizationId,
        studentId: input.studentId,
        kind: "assessment",
        message: `${input.kind}: ${input.result}`,
        actor: input.createdBy,
      });

      emitLearningEvent({
        organizationId: input.organizationId,
        entityType: "AssessmentRecord",
        entityId: id,
        eventType: "assessment_recorded",
        actor: input.createdBy,
        metadata: { studentId: input.studentId, kind: input.kind },
      });
      return row;
    },

    list: listAssessments,

    search(input: {
      organizationId: string;
      studentId?: string;
      kind?: AssessmentKind;
      curriculumId?: string;
      q?: string;
    }) {
      const q = input.q?.trim().toLowerCase();
      return Object.freeze(
        listAssessments(input.organizationId, {
          studentId: input.studentId,
          kind: input.kind,
          curriculumId: input.curriculumId,
        }).filter((a) => {
          if (!q) return true;
          return (
            a.notes.toLowerCase().includes(q) ||
            String(a.result).toLowerCase().includes(q)
          );
        })
      );
    },
  };
}
