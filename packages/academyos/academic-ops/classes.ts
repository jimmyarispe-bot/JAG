import { randomUUID } from "node:crypto";
import { projectAcademyEntityToTwin } from "../twin/project";
import { emitAcademicOpsEvent } from "./events";
import { DEFAULT_TIMEZONE, validateVirtualSlot } from "./rules";
import {
  getClass,
  getTeacher,
  listClasses,
  upsertClass,
} from "./store";
import type {
  AoClass,
  ClassPeriodSlot,
  ClassStatus,
} from "./types";
import { CLASS_STATUSES } from "./types";

function validateSchedule(
  isVirtual: boolean,
  schedule: readonly ClassPeriodSlot[]
): string | null {
  for (const slot of schedule) {
    const err = validateVirtualSlot({
      isVirtual,
      startTime: slot.startTime,
      endTime: slot.endTime,
    });
    if (err) return err;
  }
  return null;
}

export function createClassesService() {
  return {
    create(input: {
      organizationId: string;
      name: string;
      subject: string;
      program?: string;
      teacherId: string;
      teachingAssistantIds?: readonly string[];
      schoolId?: string | null;
      campusId?: string | null;
      gradeLevels?: readonly string[];
      room?: string | null;
      virtualMeetingUrl?: string | null;
      isVirtual?: boolean;
      timezone?: string;
      capacity: number;
      schedule: readonly ClassPeriodSlot[];
      calendarId?: string | null;
      createdBy: string;
    }): AoClass | { error: string } {
      if (!input.name.trim()) return { error: "Class name is required." };
      if (!input.subject.trim()) return { error: "Subject is required." };
      if (input.capacity < 1) return { error: "Capacity must be at least 1." };
      if (!getTeacher(input.organizationId, input.teacherId)) {
        return { error: "Teacher not found." };
      }
      const isVirtual = input.isVirtual ?? Boolean(input.virtualMeetingUrl);
      const scheduleErr = validateSchedule(isVirtual, input.schedule);
      if (scheduleErr) return { error: scheduleErr };

      const now = new Date().toISOString();
      const id = randomUUID();
      const twinId = projectAcademyEntityToTwin({
        organizationId: input.organizationId,
        academyEntity: "Class",
        twinEntityType: "Product / Service",
        id,
        label: input.name.trim(),
        kind: "class",
        actor: input.createdBy,
        metadata: {
          subject: input.subject,
          teacherId: input.teacherId,
        },
      });

      if (input.room || isVirtual) {
        projectAcademyEntityToTwin({
          organizationId: input.organizationId,
          academyEntity: "Classroom",
          twinEntityType: "Location",
          id: `${id}-room`,
          label: input.room ?? "Virtual Classroom",
          kind: isVirtual ? "virtual_classroom" : "classroom",
          actor: input.createdBy,
        });
      }

      const cls = upsertClass({
        id,
        organizationId: input.organizationId,
        schoolId: input.schoolId ?? null,
        campusId: input.campusId ?? null,
        program: input.program ?? "General",
        subject: input.subject.trim(),
        name: input.name.trim(),
        gradeLevels: Object.freeze([...(input.gradeLevels ?? [])]),
        teacherId: input.teacherId,
        teachingAssistantIds: Object.freeze([
          ...(input.teachingAssistantIds ?? []),
        ]),
        room: input.room ?? null,
        virtualMeetingUrl: input.virtualMeetingUrl ?? null,
        isVirtual,
        timezone: input.timezone ?? DEFAULT_TIMEZONE,
        capacity: input.capacity,
        currentEnrollment: 0,
        waitlistCount: 0,
        schedule: Object.freeze([...input.schedule]),
        status: "Active",
        calendarId: input.calendarId ?? null,
        twinEntityId: twinId,
        createdAt: now,
        updatedAt: now,
        createdBy: input.createdBy,
      });
      emitAcademicOpsEvent({
        organizationId: input.organizationId,
        entityType: "AoClass",
        entityId: id,
        eventType: "class_created",
        actor: input.createdBy,
      });
      return cls;
    },

    get: getClass,
    list: listClasses,

    search(input: {
      organizationId: string;
      q?: string;
      teacherId?: string;
      campusId?: string;
      program?: string;
      status?: ClassStatus;
      subject?: string;
    }): readonly AoClass[] {
      const q = input.q?.trim().toLowerCase();
      return Object.freeze(
        listClasses(input.organizationId).filter((c) => {
          if (input.teacherId && c.teacherId !== input.teacherId) return false;
          if (input.campusId && c.campusId !== input.campusId) return false;
          if (input.program && c.program !== input.program) return false;
          if (input.status && c.status !== input.status) return false;
          if (
            input.subject &&
            c.subject.toLowerCase() !== input.subject.toLowerCase()
          ) {
            return false;
          }
          if (!q) return true;
          return (
            c.name.toLowerCase().includes(q) ||
            c.subject.toLowerCase().includes(q) ||
            c.program.toLowerCase().includes(q)
          );
        })
      );
    },

    patch(input: {
      organizationId: string;
      classId: string;
      name?: string;
      teacherId?: string;
      teachingAssistantIds?: readonly string[];
      room?: string | null;
      virtualMeetingUrl?: string | null;
      capacity?: number;
      schedule?: readonly ClassPeriodSlot[];
      status?: ClassStatus;
      actor: string;
    }): AoClass | { error: string } | null {
      const current = getClass(input.organizationId, input.classId);
      if (!current) return null;
      if (
        input.status &&
        !(CLASS_STATUSES as readonly string[]).includes(input.status)
      ) {
        return { error: "Invalid class status." };
      }
      if (input.teacherId && !getTeacher(input.organizationId, input.teacherId)) {
        return { error: "Teacher not found." };
      }
      const schedule = input.schedule ?? current.schedule;
      const scheduleErr = validateSchedule(current.isVirtual, schedule);
      if (scheduleErr) return { error: scheduleErr };
      if (
        input.capacity != null &&
        input.capacity < current.currentEnrollment
      ) {
        return { error: "Capacity cannot be below current enrollment." };
      }

      const next = upsertClass({
        ...current,
        name: input.name?.trim() || current.name,
        teacherId: input.teacherId ?? current.teacherId,
        teachingAssistantIds: input.teachingAssistantIds
          ? Object.freeze([...input.teachingAssistantIds])
          : current.teachingAssistantIds,
        room: input.room !== undefined ? input.room : current.room,
        virtualMeetingUrl:
          input.virtualMeetingUrl !== undefined
            ? input.virtualMeetingUrl
            : current.virtualMeetingUrl,
        capacity: input.capacity ?? current.capacity,
        schedule: Object.freeze([...schedule]),
        status: input.status ?? current.status,
        updatedAt: new Date().toISOString(),
      });
      emitAcademicOpsEvent({
        organizationId: input.organizationId,
        entityType: "AoClass",
        entityId: next.id,
        eventType: "class_updated",
        actor: input.actor,
        metadata: { status: next.status },
      });
      return next;
    },

    archive(input: {
      organizationId: string;
      classId: string;
      actor: string;
    }): AoClass | null {
      const result = this.patch({
        ...input,
        status: "Archived",
      });
      return result && !("error" in result) ? result : null;
    },

    cancel(input: {
      organizationId: string;
      classId: string;
      actor: string;
    }): AoClass | null {
      const result = this.patch({
        ...input,
        status: "Cancelled",
      });
      return result && !("error" in result) ? result : null;
    },

    duplicate(input: {
      organizationId: string;
      classId: string;
      createdBy: string;
    }): AoClass | { error: string } {
      const current = getClass(input.organizationId, input.classId);
      if (!current) return { error: "Class not found." };
      return this.create({
        organizationId: input.organizationId,
        name: `${current.name} (Copy)`,
        subject: current.subject,
        program: current.program,
        teacherId: current.teacherId,
        teachingAssistantIds: current.teachingAssistantIds,
        schoolId: current.schoolId,
        campusId: current.campusId,
        gradeLevels: current.gradeLevels,
        room: current.room,
        virtualMeetingUrl: current.virtualMeetingUrl,
        isVirtual: current.isVirtual,
        timezone: current.timezone,
        capacity: current.capacity,
        schedule: current.schedule,
        calendarId: current.calendarId,
        createdBy: input.createdBy,
      });
    },
  };
}
