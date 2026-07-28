import { randomUUID } from "node:crypto";
import { projectAcademyEntityToTwin } from "../twin/project";
import { emitWorkforceEvent } from "./events";
import {
  getEmployee,
  getPosition,
  listEmployees,
  upsertEmployee,
} from "./store";
import type { Employee, EmployeeStatus, EmploymentType } from "./types";
import { EMPLOYEE_STATUSES, EMPLOYMENT_TYPES } from "./types";

export function createEmployeeService() {
  return {
    create(input: {
      organizationId: string;
      displayName: string;
      email?: string | null;
      employmentType: EmploymentType;
      campusId?: string | null;
      campusName?: string | null;
      department?: string | null;
      positionId?: string | null;
      supervisorId?: string | null;
      hireDate?: string | null;
      annualSalary?: number | null;
      hourlyRate?: number | null;
      status?: EmployeeStatus;
      createdBy: string;
    }): Employee | { error: string } {
      if (!input.displayName.trim()) {
        return { error: "displayName is required." };
      }
      if (
        !(EMPLOYMENT_TYPES as readonly string[]).includes(input.employmentType)
      ) {
        return { error: "Invalid employment type." };
      }
      if (
        input.positionId &&
        !getPosition(input.organizationId, input.positionId)
      ) {
        return { error: "Position not found." };
      }

      const now = new Date().toISOString();
      const id = randomUUID();
      const twinId = projectAcademyEntityToTwin({
        organizationId: input.organizationId,
        academyEntity: "Employee",
        twinEntityType: "Person",
        id,
        label: input.displayName.trim(),
        kind: "employee",
        actor: input.createdBy,
        metadata: { employmentType: input.employmentType },
      });

      const employee = upsertEmployee({
        id,
        organizationId: input.organizationId,
        employeeNumber: `EMP-${id.slice(0, 8).toUpperCase()}`,
        displayName: input.displayName.trim(),
        email: input.email ?? null,
        employmentType: input.employmentType,
        status: input.status ?? "Active",
        campusId: input.campusId ?? null,
        campusName: input.campusName ?? null,
        department: input.department ?? null,
        positionId: input.positionId ?? null,
        supervisorId: input.supervisorId ?? null,
        hireDate: input.hireDate?.slice(0, 10) ?? now.slice(0, 10),
        backgroundCheckClear: false,
        trainingComplete: false,
        annualSalary: input.annualSalary ?? null,
        hourlyRate: input.hourlyRate ?? null,
        portalToken: randomUUID().replace(/-/g, ""),
        twinEntityId: twinId,
        createdAt: now,
        updatedAt: now,
        createdBy: input.createdBy,
      });

      emitWorkforceEvent({
        organizationId: input.organizationId,
        entityType: "Employee",
        entityId: id,
        eventType: "employee_created",
        actor: input.createdBy,
      });
      return employee;
    },

    get: getEmployee,
    list: listEmployees,

    search(input: {
      organizationId: string;
      q?: string;
      status?: EmployeeStatus;
      campusId?: string;
      employmentType?: EmploymentType;
      department?: string;
    }) {
      const q = input.q?.trim().toLowerCase();
      return Object.freeze(
        listEmployees(input.organizationId).filter((e) => {
          if (input.status && e.status !== input.status) return false;
          if (input.campusId && e.campusId !== input.campusId) return false;
          if (
            input.employmentType &&
            e.employmentType !== input.employmentType
          ) {
            return false;
          }
          if (input.department && e.department !== input.department)
            return false;
          if (!q) return true;
          return (
            e.displayName.toLowerCase().includes(q) ||
            e.employeeNumber.toLowerCase().includes(q) ||
            (e.email?.toLowerCase().includes(q) ?? false)
          );
        })
      );
    },

    patch(input: {
      organizationId: string;
      employeeId: string;
      displayName?: string;
      email?: string | null;
      status?: EmployeeStatus;
      campusId?: string | null;
      campusName?: string | null;
      department?: string | null;
      positionId?: string | null;
      supervisorId?: string | null;
      backgroundCheckClear?: boolean;
      trainingComplete?: boolean;
      annualSalary?: number | null;
      hourlyRate?: number | null;
      actor: string;
    }): Employee | { error: string } | null {
      const current = getEmployee(input.organizationId, input.employeeId);
      if (!current) return null;
      if (
        input.status &&
        !(EMPLOYEE_STATUSES as readonly string[]).includes(input.status)
      ) {
        return { error: "Invalid employee status." };
      }
      if (
        input.positionId &&
        !getPosition(input.organizationId, input.positionId)
      ) {
        return { error: "Position not found." };
      }
      const next = upsertEmployee({
        ...current,
        displayName: input.displayName?.trim() || current.displayName,
        email: input.email !== undefined ? input.email : current.email,
        status: input.status ?? current.status,
        campusId:
          input.campusId !== undefined ? input.campusId : current.campusId,
        campusName:
          input.campusName !== undefined
            ? input.campusName
            : current.campusName,
        department:
          input.department !== undefined
            ? input.department
            : current.department,
        positionId:
          input.positionId !== undefined
            ? input.positionId
            : current.positionId,
        supervisorId:
          input.supervisorId !== undefined
            ? input.supervisorId
            : current.supervisorId,
        backgroundCheckClear:
          input.backgroundCheckClear ?? current.backgroundCheckClear,
        trainingComplete: input.trainingComplete ?? current.trainingComplete,
        annualSalary:
          input.annualSalary !== undefined
            ? input.annualSalary
            : current.annualSalary,
        hourlyRate:
          input.hourlyRate !== undefined
            ? input.hourlyRate
            : current.hourlyRate,
        updatedAt: new Date().toISOString(),
      });
      emitWorkforceEvent({
        organizationId: input.organizationId,
        entityType: "Employee",
        entityId: next.id,
        eventType: "employee_updated",
        actor: input.actor,
        metadata: { status: next.status },
      });
      return next;
    },
  };
}
