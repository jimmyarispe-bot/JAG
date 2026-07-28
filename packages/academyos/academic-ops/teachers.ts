import { randomUUID } from "node:crypto";
import { projectAcademyEntityToTwin } from "../twin/project";
import { emitAcademicOpsEvent } from "./events";
import { DEFAULT_TIMEZONE } from "./rules";
import { getTeacher, listTeachers, upsertTeacher } from "./store";
import type { AoTeacher, TeacherAvailability } from "./types";

export function createTeachersService() {
  return {
    create(input: {
      organizationId: string;
      displayName: string;
      email?: string | null;
      campusIds?: readonly string[];
      subjects?: readonly string[];
      availability?: readonly TeacherAvailability[];
      timezone?: string;
      createdBy: string;
    }): AoTeacher | { error: string } {
      if (!input.displayName.trim()) {
        return { error: "Teacher displayName is required." };
      }
      const now = new Date().toISOString();
      const id = randomUUID();
      const twinId = projectAcademyEntityToTwin({
        organizationId: input.organizationId,
        academyEntity: "Teacher",
        twinEntityType: "Person",
        id,
        label: input.displayName.trim(),
        kind: "teacher",
        actor: input.createdBy,
      });
      const teacher = upsertTeacher({
        id,
        organizationId: input.organizationId,
        displayName: input.displayName.trim(),
        email: input.email ?? null,
        campusIds: Object.freeze([...(input.campusIds ?? [])]),
        subjects: Object.freeze([...(input.subjects ?? [])]),
        availability: Object.freeze([...(input.availability ?? [])]),
        timezone: input.timezone ?? DEFAULT_TIMEZONE,
        twinEntityId: twinId,
        createdAt: now,
        updatedAt: now,
        createdBy: input.createdBy,
      });
      emitAcademicOpsEvent({
        organizationId: input.organizationId,
        entityType: "AoTeacher",
        entityId: id,
        eventType: "teacher_created",
        actor: input.createdBy,
      });
      return teacher;
    },

    get: getTeacher,
    list: listTeachers,

    search(input: {
      organizationId: string;
      q?: string;
      campusId?: string;
      subject?: string;
    }): readonly AoTeacher[] {
      const q = input.q?.trim().toLowerCase();
      return Object.freeze(
        listTeachers(input.organizationId).filter((t) => {
          if (
            input.campusId &&
            t.campusIds.length > 0 &&
            !t.campusIds.includes(input.campusId)
          ) {
            return false;
          }
          if (
            input.subject &&
            t.subjects.length > 0 &&
            !t.subjects.some(
              (s) => s.toLowerCase() === input.subject!.toLowerCase()
            )
          ) {
            return false;
          }
          if (!q) return true;
          return (
            t.displayName.toLowerCase().includes(q) ||
            (t.email?.toLowerCase().includes(q) ?? false)
          );
        })
      );
    },

    patch(input: {
      organizationId: string;
      teacherId: string;
      displayName?: string;
      email?: string | null;
      campusIds?: readonly string[];
      subjects?: readonly string[];
      availability?: readonly TeacherAvailability[];
      actor: string;
    }): AoTeacher | null {
      const current = getTeacher(input.organizationId, input.teacherId);
      if (!current) return null;
      const next = upsertTeacher({
        ...current,
        displayName: input.displayName?.trim() || current.displayName,
        email: input.email !== undefined ? input.email : current.email,
        campusIds: input.campusIds
          ? Object.freeze([...input.campusIds])
          : current.campusIds,
        subjects: input.subjects
          ? Object.freeze([...input.subjects])
          : current.subjects,
        availability: input.availability
          ? Object.freeze([...input.availability])
          : current.availability,
        updatedAt: new Date().toISOString(),
      });
      emitAcademicOpsEvent({
        organizationId: input.organizationId,
        entityType: "AoTeacher",
        entityId: next.id,
        eventType: "teacher_updated",
        actor: input.actor,
      });
      return next;
    },
  };
}
