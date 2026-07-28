import { randomUUID } from "node:crypto";
import { projectAcademyEntityToTwin } from "../twin/project";
import { emitWorkforceEvent } from "./events";
import { getEmployee, listPerformance, upsertPerformance } from "./store";
import type { PerformanceReview } from "./types";

/**
 * Links completed reviews to Organizational Memory when a memoryLinkId is provided.
 * Does not modify Platform Foundation / memory core — stores opaque link id only.
 */
export function createPerformanceService() {
  return {
    create(input: {
      organizationId: string;
      employeeId: string;
      kind: PerformanceReview["kind"];
      title: string;
      body?: string;
      goals?: string;
      reviewedOn: string;
      reviewerId?: string | null;
      /** Optional Organizational Memory document/item id (opaque). */
      memoryLinkId?: string | null;
      createdBy: string;
    }): PerformanceReview | { error: string } {
      if (!getEmployee(input.organizationId, input.employeeId)) {
        return { error: "Employee not found." };
      }
      if (!input.title.trim()) return { error: "title is required." };

      const now = new Date().toISOString();
      const id = randomUUID();
      const twinId = projectAcademyEntityToTwin({
        organizationId: input.organizationId,
        academyEntity: "Performance Review",
        twinEntityType: "Document",
        id,
        label: input.title.trim(),
        kind: "performance_review",
        actor: input.createdBy,
        metadata: {
          reviewKind: input.kind,
          memoryLinkId: input.memoryLinkId ?? "",
        },
      });

      const review = upsertPerformance({
        id,
        organizationId: input.organizationId,
        employeeId: input.employeeId,
        kind: input.kind,
        title: input.title.trim(),
        body: input.body ?? "",
        goals: input.goals ?? "",
        reviewedOn: input.reviewedOn.slice(0, 10),
        reviewerId: input.reviewerId ?? null,
        memoryLinkId: input.memoryLinkId ?? null,
        twinEntityId: twinId,
        createdAt: now,
        createdBy: input.createdBy,
      });

      emitWorkforceEvent({
        organizationId: input.organizationId,
        entityType: "PerformanceReview",
        entityId: id,
        eventType: "performance_recorded",
        actor: input.createdBy,
        metadata: {
          kind: input.kind,
          memoryLinked: input.memoryLinkId ? "true" : "false",
        },
      });
      return review;
    },

    list: listPerformance,
  };
}
