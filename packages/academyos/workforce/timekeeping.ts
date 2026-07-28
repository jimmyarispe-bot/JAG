import { randomUUID } from "node:crypto";
import { projectAcademyEntityToTwin } from "../twin/project";
import { timesheetDueAtForWeek } from "./config";
import { emitWorkforceEvent } from "./events";
import {
  getEmployee,
  getTimekeepingConfig,
  getTimesheet,
  listTimesheets,
  setTimekeepingConfig,
  upsertTimesheet,
} from "./store";
import type {
  TimeEntry,
  Timesheet,
  TimesheetStatus,
  WorkforceTimekeepingConfig,
} from "./types";

function totalMinutes(entries: readonly TimeEntry[]): number {
  return entries.reduce((a, e) => a + e.minutes, 0);
}

export function createTimekeepingService() {
  return {
    getConfig: getTimekeepingConfig,
    configure(
      organizationId: string,
      partial: Partial<WorkforceTimekeepingConfig>
    ) {
      return setTimekeepingConfig(organizationId, {
        ...getTimekeepingConfig(organizationId),
        ...partial,
      });
    },

    create(input: {
      organizationId: string;
      employeeId: string;
      weekStarting: string;
      entries?: readonly Omit<TimeEntry, "id">[];
      createdBy: string;
    }): Timesheet | { error: string } {
      if (!getEmployee(input.organizationId, input.employeeId)) {
        return { error: "Employee not found." };
      }
      const existing = listTimesheets(
        input.organizationId,
        input.employeeId
      ).find((t) => t.weekStarting === input.weekStarting.slice(0, 10));
      if (existing) return { error: "Timesheet already exists for this week." };

      const entries = Object.freeze(
        (input.entries ?? []).map((e) => ({
          id: randomUUID(),
          date: e.date.slice(0, 10),
          minutes: e.minutes,
          source: e.source,
          sessionId: e.sessionId ?? null,
          notes: e.notes ?? "",
        }))
      );
      const now = new Date().toISOString();
      const id = randomUUID();
      const twinId = projectAcademyEntityToTwin({
        organizationId: input.organizationId,
        academyEntity: "Timesheet",
        twinEntityType: "Document",
        id,
        label: `Timesheet ${input.weekStarting}`,
        kind: "timesheet",
        actor: input.createdBy,
      });

      const sheet = upsertTimesheet({
        id,
        organizationId: input.organizationId,
        employeeId: input.employeeId,
        weekStarting: input.weekStarting.slice(0, 10),
        entries,
        totalMinutes: totalMinutes(entries),
        status: "Draft",
        submittedAt: null,
        approvedAt: null,
        approvedBy: null,
        locked: false,
        twinEntityId: twinId,
        createdAt: now,
        updatedAt: now,
        createdBy: input.createdBy,
      });

      emitWorkforceEvent({
        organizationId: input.organizationId,
        entityType: "Timesheet",
        entityId: id,
        eventType: "timesheet_created",
        actor: input.createdBy,
      });
      return sheet;
    },

    addEntry(input: {
      organizationId: string;
      timesheetId: string;
      entry: Omit<TimeEntry, "id">;
      actor: string;
    }): Timesheet | { error: string } | null {
      const current = getTimesheet(input.organizationId, input.timesheetId);
      if (!current) return null;
      if (current.locked || current.status === "Locked") {
        return { error: "Timesheet is locked." };
      }
      if (current.status === "Approved") {
        return { error: "Cannot edit approved timesheet." };
      }
      const entries = Object.freeze([
        ...current.entries,
        {
          id: randomUUID(),
          date: input.entry.date.slice(0, 10),
          minutes: input.entry.minutes,
          source: input.entry.source,
          sessionId: input.entry.sessionId ?? null,
          notes: input.entry.notes ?? "",
        },
      ]);
      return upsertTimesheet({
        ...current,
        entries,
        totalMinutes: totalMinutes(entries),
        updatedAt: new Date().toISOString(),
      });
    },

    /** Generate session-based minutes onto a timesheet. */
    addSessionTime(input: {
      organizationId: string;
      timesheetId: string;
      sessionId: string;
      date: string;
      minutes: number;
      actor: string;
    }) {
      return this.addEntry({
        organizationId: input.organizationId,
        timesheetId: input.timesheetId,
        entry: {
          date: input.date,
          minutes: input.minutes,
          source: "Session",
          sessionId: input.sessionId,
          notes: `Session ${input.sessionId}`,
        },
        actor: input.actor,
      });
    },

    submit(input: {
      organizationId: string;
      timesheetId: string;
      actor: string;
      asOf?: string;
    }): Timesheet | { error: string } | null {
      const current = getTimesheet(input.organizationId, input.timesheetId);
      if (!current) return null;
      if (current.status !== "Draft" && current.status !== "Rejected") {
        return { error: "Only draft/rejected timesheets can be submitted." };
      }
      const config = getTimekeepingConfig(input.organizationId);
      const due = timesheetDueAtForWeek(current.weekStarting, config);
      void due; // policy reference for reminders
      const next = upsertTimesheet({
        ...current,
        status: "Submitted",
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      emitWorkforceEvent({
        organizationId: input.organizationId,
        entityType: "Timesheet",
        entityId: next.id,
        eventType: "timesheet_submitted",
        actor: input.actor,
      });
      return next;
    },

    approve(input: {
      organizationId: string;
      timesheetId: string;
      actor: string;
      isSchoolLeader?: boolean;
    }): Timesheet | { error: string } | null {
      const current = getTimesheet(input.organizationId, input.timesheetId);
      if (!current) return null;
      if (current.status !== "Submitted") {
        return { error: "Only submitted timesheets can be approved." };
      }
      const config = getTimekeepingConfig(input.organizationId);
      if (config.requireSchoolLeaderApproval && input.isSchoolLeader === false) {
        return { error: "School leader approval is required." };
      }
      const next = upsertTimesheet({
        ...current,
        status: config.lockAfterApproval ? "Locked" : "Approved",
        approvedAt: new Date().toISOString(),
        approvedBy: input.actor,
        locked: config.lockAfterApproval,
        updatedAt: new Date().toISOString(),
      });
      emitWorkforceEvent({
        organizationId: input.organizationId,
        entityType: "Timesheet",
        entityId: next.id,
        eventType: "timesheet_approved",
        actor: input.actor,
      });
      return next;
    },

    reject(input: {
      organizationId: string;
      timesheetId: string;
      actor: string;
    }): Timesheet | null {
      const current = getTimesheet(input.organizationId, input.timesheetId);
      if (!current || current.locked) return null;
      return upsertTimesheet({
        ...current,
        status: "Rejected" as TimesheetStatus,
        updatedAt: new Date().toISOString(),
      });
    },

    get: getTimesheet,
    list: listTimesheets,
  };
}
