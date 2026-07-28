import { randomUUID } from "node:crypto";
import { emitWorkforceEvent } from "./events";
import {
  getEmployee,
  listAbsences,
  upsertAbsence,
} from "./store";
import type { AbsenceRequest } from "./types";

export function createSubstituteService() {
  return {
    requestAbsence(input: {
      organizationId: string;
      employeeId: string;
      startsOn: string;
      endsOn: string;
      reason: string;
      sessionIds?: readonly string[];
      createdBy: string;
    }): AbsenceRequest | { error: string } {
      if (!getEmployee(input.organizationId, input.employeeId)) {
        return { error: "Employee not found." };
      }
      if (!input.reason.trim()) return { error: "reason is required." };

      const now = new Date().toISOString();
      const absence = upsertAbsence({
        id: randomUUID(),
        organizationId: input.organizationId,
        employeeId: input.employeeId,
        startsOn: input.startsOn.slice(0, 10),
        endsOn: input.endsOn.slice(0, 10),
        reason: input.reason.trim(),
        status: "Requested",
        substituteEmployeeId: null,
        sessionIds: Object.freeze([...(input.sessionIds ?? [])]),
        createdAt: now,
        updatedAt: now,
        createdBy: input.createdBy,
      });

      emitWorkforceEvent({
        organizationId: input.organizationId,
        entityType: "AbsenceRequest",
        entityId: absence.id,
        eventType: "absence_requested",
        actor: input.createdBy,
        metadata: { employeeId: input.employeeId },
      });
      return absence;
    },

    assignSubstitute(input: {
      organizationId: string;
      absenceId: string;
      substituteEmployeeId: string;
      actor: string;
    }): AbsenceRequest | { error: string } | null {
      const current = listAbsences(input.organizationId).find(
        (a) => a.id === input.absenceId
      );
      if (!current) return null;
      const sub = getEmployee(
        input.organizationId,
        input.substituteEmployeeId
      );
      if (!sub) return { error: "Substitute employee not found." };
      if (
        sub.employmentType !== "Substitute" &&
        sub.employmentType !== "Full-time" &&
        sub.employmentType !== "Part-time" &&
        sub.employmentType !== "Temporary"
      ) {
        return { error: "Employee cannot be assigned as substitute." };
      }

      const next = upsertAbsence({
        ...current,
        substituteEmployeeId: sub.id,
        status: "Covered",
        updatedAt: new Date().toISOString(),
      });

      emitWorkforceEvent({
        organizationId: input.organizationId,
        entityType: "AbsenceRequest",
        entityId: next.id,
        eventType: "substitute_assigned",
        actor: input.actor,
        metadata: {
          substituteEmployeeId: sub.id,
          sessions: String(current.sessionIds.length),
        },
      });
      return next;
    },

    list: listAbsences,

    coverageStats(organizationId: string) {
      const all = listAbsences(organizationId);
      const covered = all.filter((a) => a.status === "Covered").length;
      return {
        requests: all.length,
        covered,
        uncovered: all.filter((a) => a.status === "Requested").length,
        coverageRate:
          all.length === 0
            ? 100
            : Math.round((covered / all.length) * 1000) / 10,
      };
    },
  };
}
