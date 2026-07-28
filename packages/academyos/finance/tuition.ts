import { randomUUID } from "node:crypto";
import { projectAcademyEntityToTwin } from "../twin/project";
import { emitFinanceEvent } from "./events";
import {
  getTuitionPlan,
  listTuitionPlans,
  listTuitionSchedules,
  upsertTuitionPlan,
  upsertTuitionSchedule,
} from "./store";
import type { TuitionFrequency, TuitionPlan, TuitionSchedule } from "./types";
import { TUITION_FREQUENCIES } from "./types";

export function createTuitionService() {
  return {
    createPlan(input: {
      organizationId: string;
      name: string;
      frequency: TuitionFrequency;
      baseAmount: number;
      program?: string | null;
      campusId?: string | null;
      gradeLevel?: string | null;
      siblingDiscountPercent?: number | null;
      promotionalDiscountPercent?: number;
      effectiveFrom: string;
      effectiveTo?: string | null;
      createdBy: string;
    }): TuitionPlan | { error: string } {
      if (!input.name.trim()) return { error: "Plan name is required." };
      if (!(TUITION_FREQUENCIES as readonly string[]).includes(input.frequency)) {
        return { error: "Invalid tuition frequency." };
      }
      if (input.baseAmount < 0) return { error: "baseAmount must be >= 0." };

      const now = new Date().toISOString();
      const id = randomUUID();
      const twinId = projectAcademyEntityToTwin({
        organizationId: input.organizationId,
        academyEntity: "Tuition Plan",
        twinEntityType: "Document",
        id,
        label: input.name.trim(),
        kind: "tuition_plan",
        actor: input.createdBy,
      });

      const plan = upsertTuitionPlan({
        id,
        organizationId: input.organizationId,
        name: input.name.trim(),
        frequency: input.frequency,
        baseAmount: input.baseAmount,
        program: input.program ?? null,
        campusId: input.campusId ?? null,
        gradeLevel: input.gradeLevel ?? null,
        siblingDiscountPercent: input.siblingDiscountPercent ?? null,
        promotionalDiscountPercent: input.promotionalDiscountPercent ?? 0,
        effectiveFrom: input.effectiveFrom.slice(0, 10),
        effectiveTo: input.effectiveTo?.slice(0, 10) ?? null,
        status: "Active",
        twinEntityId: twinId,
        createdAt: now,
        updatedAt: now,
        createdBy: input.createdBy,
      });

      emitFinanceEvent({
        organizationId: input.organizationId,
        entityType: "TuitionPlan",
        entityId: id,
        eventType: "tuition_plan_created",
        actor: input.createdBy,
      });
      return plan;
    },

    getPlan: getTuitionPlan,
    listPlans: listTuitionPlans,

    patchPlan(input: {
      organizationId: string;
      planId: string;
      name?: string;
      baseAmount?: number;
      status?: "Draft" | "Active" | "Archived";
      promotionalDiscountPercent?: number;
      actor: string;
    }): TuitionPlan | null {
      const current = getTuitionPlan(input.organizationId, input.planId);
      if (!current) return null;
      const next = upsertTuitionPlan({
        ...current,
        name: input.name?.trim() || current.name,
        baseAmount: input.baseAmount ?? current.baseAmount,
        status: input.status ?? current.status,
        promotionalDiscountPercent:
          input.promotionalDiscountPercent ??
          current.promotionalDiscountPercent,
        updatedAt: new Date().toISOString(),
      });
      emitFinanceEvent({
        organizationId: input.organizationId,
        entityType: "TuitionPlan",
        entityId: next.id,
        eventType: "tuition_plan_updated",
        actor: input.actor,
      });
      return next;
    },

    assignSchedule(input: {
      organizationId: string;
      tuitionPlanId: string;
      familyAccountId: string;
      studentId: string;
      amount?: number;
      dueDay?: number;
      startsOn: string;
      endsOn?: string | null;
      createdBy: string;
    }): TuitionSchedule | { error: string } {
      const plan = getTuitionPlan(input.organizationId, input.tuitionPlanId);
      if (!plan) return { error: "Tuition plan not found." };
      const schedule = upsertTuitionSchedule({
        id: randomUUID(),
        organizationId: input.organizationId,
        tuitionPlanId: plan.id,
        familyAccountId: input.familyAccountId,
        studentId: input.studentId,
        amount: input.amount ?? plan.baseAmount,
        dueDay: input.dueDay ?? 25,
        startsOn: input.startsOn.slice(0, 10),
        endsOn: input.endsOn?.slice(0, 10) ?? null,
        active: true,
        createdAt: new Date().toISOString(),
        createdBy: input.createdBy,
      });
      emitFinanceEvent({
        organizationId: input.organizationId,
        entityType: "TuitionSchedule",
        entityId: schedule.id,
        eventType: "tuition_schedule_assigned",
        actor: input.createdBy,
        metadata: { familyAccountId: input.familyAccountId },
      });
      return schedule;
    },

    listSchedules: listTuitionSchedules,
  };
}
