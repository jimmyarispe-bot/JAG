import { randomUUID } from "node:crypto";
import { projectAcademyEntityToTwin } from "../twin/project";
import { emitLearningEvent } from "./events";
import {
  getCurriculum,
  listCurricula,
  upsertCurriculum,
} from "./store";
import type {
  Competency,
  Curriculum,
  CurriculumCourse,
  CurriculumStatus,
  LearningObjective,
} from "./types";
import { CURRICULUM_STATUSES } from "./types";

export function createCurriculumService() {
  return {
    create(input: {
      organizationId: string;
      name: string;
      version?: string;
      program?: string | null;
      campusId?: string | null;
      gradeLevels?: readonly string[];
      subject: string;
      courses?: readonly CurriculumCourse[];
      competencies?: readonly Competency[];
      objectives?: readonly LearningObjective[];
      effectiveFrom?: string | null;
      createdBy: string;
      publish?: boolean;
    }): Curriculum | { error: string } {
      if (!input.name.trim()) return { error: "Curriculum name is required." };
      if (!input.subject.trim()) return { error: "Subject is required." };

      const now = new Date().toISOString();
      const id = randomUUID();
      const objectives = Object.freeze([...(input.objectives ?? [])]);
      const competencies = Object.freeze([...(input.competencies ?? [])]);

      for (const obj of objectives) {
        projectAcademyEntityToTwin({
          organizationId: input.organizationId,
          academyEntity: "Learning Objective",
          twinEntityType: "Document",
          id: obj.id,
          label: obj.title,
          kind: "learning_objective",
          actor: input.createdBy,
        });
      }

      const twinId = projectAcademyEntityToTwin({
        organizationId: input.organizationId,
        academyEntity: "Curriculum",
        twinEntityType: "Document",
        id,
        label: input.name.trim(),
        kind: "curriculum",
        actor: input.createdBy,
        metadata: { subject: input.subject, version: input.version ?? "1.0" },
      });

      const curriculum = upsertCurriculum({
        id,
        organizationId: input.organizationId,
        name: input.name.trim(),
        version: input.version ?? "1.0",
        status: input.publish ? "Published" : "Draft",
        program: input.program ?? null,
        campusId: input.campusId ?? null,
        gradeLevels: Object.freeze([...(input.gradeLevels ?? [])]),
        subject: input.subject.trim(),
        courses: Object.freeze([...(input.courses ?? [])]),
        competencies,
        objectives,
        effectiveFrom: input.effectiveFrom?.slice(0, 10) ?? null,
        effectiveTo: null,
        twinEntityId: twinId,
        createdAt: now,
        updatedAt: now,
        createdBy: input.createdBy,
      });

      emitLearningEvent({
        organizationId: input.organizationId,
        entityType: "Curriculum",
        entityId: id,
        eventType: "curriculum_created",
        actor: input.createdBy,
        metadata: { status: curriculum.status },
      });
      return curriculum;
    },

    get: getCurriculum,
    list: listCurricula,

    search(input: {
      organizationId: string;
      q?: string;
      status?: CurriculumStatus;
      program?: string;
      campusId?: string;
      gradeLevel?: string;
      subject?: string;
    }): readonly Curriculum[] {
      const q = input.q?.trim().toLowerCase();
      return Object.freeze(
        listCurricula(input.organizationId).filter((c) => {
          if (input.status && c.status !== input.status) return false;
          if (input.program && c.program !== input.program) return false;
          if (input.campusId && c.campusId !== input.campusId) return false;
          if (input.subject && c.subject !== input.subject) return false;
          if (
            input.gradeLevel &&
            c.gradeLevels.length > 0 &&
            !c.gradeLevels.includes(input.gradeLevel)
          ) {
            return false;
          }
          if (!q) return true;
          return (
            c.name.toLowerCase().includes(q) ||
            c.subject.toLowerCase().includes(q)
          );
        })
      );
    },

    patch(input: {
      organizationId: string;
      curriculumId: string;
      name?: string;
      status?: CurriculumStatus;
      objectives?: readonly LearningObjective[];
      courses?: readonly CurriculumCourse[];
      effectiveTo?: string | null;
      actor: string;
    }): Curriculum | { error: string } | null {
      const current = getCurriculum(input.organizationId, input.curriculumId);
      if (!current) return null;
      if (
        input.status &&
        !(CURRICULUM_STATUSES as readonly string[]).includes(input.status)
      ) {
        return { error: "Invalid curriculum status." };
      }
      const next = upsertCurriculum({
        ...current,
        name: input.name?.trim() || current.name,
        status: input.status ?? current.status,
        objectives: input.objectives
          ? Object.freeze([...input.objectives])
          : current.objectives,
        courses: input.courses
          ? Object.freeze([...input.courses])
          : current.courses,
        effectiveTo:
          input.effectiveTo !== undefined
            ? input.effectiveTo?.slice(0, 10) ?? null
            : current.effectiveTo,
        updatedAt: new Date().toISOString(),
      });
      emitLearningEvent({
        organizationId: input.organizationId,
        entityType: "Curriculum",
        entityId: next.id,
        eventType: "curriculum_updated",
        actor: input.actor,
        metadata: { status: next.status },
      });
      return next;
    },

    publish(input: {
      organizationId: string;
      curriculumId: string;
      actor: string;
    }) {
      return this.patch({ ...input, status: "Published" });
    },

    archive(input: {
      organizationId: string;
      curriculumId: string;
      actor: string;
    }) {
      return this.patch({ ...input, status: "Archived" });
    },
  };
}
