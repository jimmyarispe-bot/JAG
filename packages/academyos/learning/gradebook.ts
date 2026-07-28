/**
 * Mastery-based teacher gradebook (not percentage-primary).
 */

import { createAssessmentService } from "./assessments";
import { createInterventionService } from "./interventions";
import { createMasteryService } from "./mastery";
import { createProgressService } from "./progress";
import {
  listAssessments,
  listMastery,
  listMasteryHistory,
  listObservations,
  upsertObservation,
} from "./store";
import { projectAcademyEntityToTwin } from "../twin/project";
import { emitLearningEvent } from "./events";
import { randomUUID } from "node:crypto";
import { getStudent } from "../sis/store";
import type { TeacherObservation } from "./types";

export type GradebookView = {
  readonly teacherId: string | null;
  readonly studentId: string;
  readonly mastery: ReturnType<typeof listMastery>;
  readonly assessments: ReturnType<typeof listAssessments>;
  readonly observations: ReturnType<typeof listObservations>;
  readonly history: ReturnType<typeof listMasteryHistory>;
  readonly activeInterventions: number;
};

export function createGradebookService() {
  const assessments = createAssessmentService();
  const mastery = createMasteryService();
  const progress = createProgressService();
  const interventions = createInterventionService();

  return {
    get(input: {
      organizationId: string;
      studentId: string;
      teacherId?: string | null;
    }): GradebookView | { error: string } {
      if (!getStudent(input.organizationId, input.studentId)) {
        return { error: "Student not found." };
      }
      const active = interventions
        .list(input.organizationId, { studentId: input.studentId })
        .filter((i) => i.status === "Active" || i.status === "Review Due");
      return {
        teacherId: input.teacherId ?? null,
        studentId: input.studentId,
        mastery: listMastery(input.organizationId, input.studentId),
        assessments: listAssessments(input.organizationId, {
          studentId: input.studentId,
        }),
        observations: listObservations(
          input.organizationId,
          input.studentId
        ),
        history: listMasteryHistory(input.organizationId, input.studentId),
        activeInterventions: active.length,
      };
    },

    recordAssessment: assessments.record.bind(assessments),
    updateMastery: mastery.update.bind(mastery),

    addObservation(input: {
      organizationId: string;
      studentId: string;
      teacherId?: string | null;
      body: string;
      assessedOn?: string;
      artifactUrls?: readonly string[];
      createdBy: string;
    }): TeacherObservation | { error: string } {
      if (!getStudent(input.organizationId, input.studentId)) {
        return { error: "Student not found." };
      }
      if (!input.body.trim()) return { error: "Observation body is required." };
      const now = new Date().toISOString();
      const id = randomUUID();
      const twinId = projectAcademyEntityToTwin({
        organizationId: input.organizationId,
        academyEntity: "Teacher Observation",
        twinEntityType: "Document",
        id,
        label: `Observation ${input.assessedOn ?? now.slice(0, 10)}`,
        kind: "teacher_observation",
        actor: input.createdBy,
      });
      const row = upsertObservation({
        id,
        organizationId: input.organizationId,
        studentId: input.studentId,
        teacherId: input.teacherId ?? null,
        body: input.body.trim(),
        assessedOn: (input.assessedOn ?? now).slice(0, 10),
        artifactUrls: Object.freeze([...(input.artifactUrls ?? [])]),
        twinEntityId: twinId,
        createdAt: now,
        createdBy: input.createdBy,
      });
      emitLearningEvent({
        organizationId: input.organizationId,
        entityType: "TeacherObservation",
        entityId: id,
        eventType: "observation_recorded",
        actor: input.createdBy,
        metadata: { studentId: input.studentId },
      });
      return row;
    },

    attachArtifact(input: {
      organizationId: string;
      studentId: string;
      observationId?: string;
      assessmentId?: string;
      url: string;
      createdBy: string;
    }) {
      if (!input.url.trim()) return { error: "url is required." };
      if (input.observationId) {
        const obs = listObservations(input.organizationId, input.studentId).find(
          (o) => o.id === input.observationId
        );
        if (!obs) return { error: "Observation not found." };
        return upsertObservation({
          ...obs,
          artifactUrls: Object.freeze([...obs.artifactUrls, input.url.trim()]),
        });
      }
      return assessments.record({
        organizationId: input.organizationId,
        studentId: input.studentId,
        kind: "Observation",
        assessedOn: new Date().toISOString(),
        result: "Artifact attached",
        notes: `Artifact: ${input.url}`,
        evidenceUrls: [input.url.trim()],
        updateMastery: false,
        createdBy: input.createdBy,
      });
    },

    reviewHistory: listMasteryHistory,
    takeSnapshot: progress.snapshot.bind(progress),
  };
}
