import { randomUUID } from "node:crypto";
import { projectAcademyEntityToTwin } from "../twin/project";
import { recordStudentTimeline } from "./audit";
import { emitSisEvent } from "./events";
import {
  getStudent,
  getSupportPlan,
  listSupportPlans,
  upsertSupportPlan,
} from "./store";
import type { SupportPlan, SupportPlanKind } from "./types";
import { SUPPORT_PLAN_KINDS } from "./types";

export function createSupportPlansService() {
  return {
    create(input: {
      organizationId: string;
      studentId: string;
      kind: SupportPlanKind;
      title: string;
      effectiveFrom: string;
      effectiveTo?: string | null;
      assignedStaffIds?: readonly string[];
      reviewDate?: string | null;
      requiredDocumentation?: string;
      createdBy: string;
    }): SupportPlan | { error: string } {
      if (!getStudent(input.organizationId, input.studentId)) {
        return { error: "Student not found." };
      }
      if (!(SUPPORT_PLAN_KINDS as readonly string[]).includes(input.kind)) {
        return { error: "Invalid support plan kind." };
      }
      if (!input.title.trim()) return { error: "Title is required." };

      const now = new Date().toISOString();
      const id = randomUUID();
      const twinId = projectAcademyEntityToTwin({
        organizationId: input.organizationId,
        academyEntity: "IEP",
        twinEntityType: "Document",
        id,
        label: input.title.trim(),
        kind: input.kind.toLowerCase().replace(/\s+/g, "_"),
        actor: input.createdBy,
        metadata: {
          studentId: input.studentId,
          supportKind: input.kind,
        },
      });

      // Support services also project as Product / Service for catalog discovery
      projectAcademyEntityToTwin({
        organizationId: input.organizationId,
        academyEntity: "Course",
        twinEntityType: "Product / Service",
        id: `svc-${id}`,
        label: `${input.kind} service`,
        kind: "support_service",
        actor: input.createdBy,
        metadata: { planId: id, studentId: input.studentId },
      });

      const plan = upsertSupportPlan({
        id,
        organizationId: input.organizationId,
        studentId: input.studentId,
        kind: input.kind,
        title: input.title.trim(),
        effectiveFrom: input.effectiveFrom.slice(0, 10),
        effectiveTo: input.effectiveTo ?? null,
        assignedStaffIds: Object.freeze([...(input.assignedStaffIds ?? [])]),
        reviewDate: input.reviewDate ?? null,
        requiredDocumentation: input.requiredDocumentation ?? "",
        status: "Active",
        twinEntityId: twinId,
        createdAt: now,
        updatedAt: now,
        createdBy: input.createdBy,
      });

      recordStudentTimeline({
        organizationId: input.organizationId,
        studentId: input.studentId,
        kind: "iep_review",
        message: `${input.kind} created: ${plan.title}.`,
        actor: input.createdBy,
      });
      emitSisEvent({
        organizationId: input.organizationId,
        entityType: "SupportPlan",
        entityId: id,
        eventType: "support_plan_created",
        actor: input.createdBy,
        metadata: { studentId: input.studentId, kind: input.kind },
      });
      return plan;
    },

    get: getSupportPlan,
    list: listSupportPlans,

    patch(input: {
      organizationId: string;
      planId: string;
      actor: string;
      status?: SupportPlan["status"];
      reviewDate?: string | null;
      assignedStaffIds?: readonly string[];
      requiredDocumentation?: string;
      effectiveTo?: string | null;
    }): SupportPlan | null {
      const current = getSupportPlan(input.organizationId, input.planId);
      if (!current) return null;
      const now = new Date().toISOString();
      let status = input.status ?? current.status;
      if (
        !input.status &&
        input.reviewDate &&
        Date.parse(input.reviewDate) < Date.parse(now)
      ) {
        status = "Review Due";
      }
      const next = upsertSupportPlan({
        ...current,
        status,
        reviewDate:
          input.reviewDate !== undefined
            ? input.reviewDate
            : current.reviewDate,
        assignedStaffIds:
          input.assignedStaffIds !== undefined
            ? Object.freeze([...input.assignedStaffIds])
            : current.assignedStaffIds,
        requiredDocumentation:
          input.requiredDocumentation ?? current.requiredDocumentation,
        effectiveTo:
          input.effectiveTo !== undefined
            ? input.effectiveTo
            : current.effectiveTo,
        updatedAt: now,
      });
      recordStudentTimeline({
        organizationId: input.organizationId,
        studentId: current.studentId,
        kind: "iep_review",
        message: `Support plan updated: ${next.title} (${next.status}).`,
        actor: input.actor,
      });
      return next;
    },

    reviewsDue(organizationId: string, now = new Date()): readonly SupportPlan[] {
      const t = now.getTime();
      return Object.freeze(
        listSupportPlans(organizationId).filter(
          (p) =>
            p.status === "Active" ||
            p.status === "Review Due" ||
            (p.reviewDate != null && Date.parse(p.reviewDate) <= t)
        )
      );
    },
  };
}
