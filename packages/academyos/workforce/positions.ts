import { randomUUID } from "node:crypto";
import { projectAcademyEntityToTwin } from "../twin/project";
import { emitWorkforceEvent } from "./events";
import { getPosition, listPositions, upsertPosition } from "./store";
import type { Position } from "./types";

export function createPositionService() {
  return {
    create(input: {
      organizationId: string;
      title: string;
      department?: string | null;
      description?: string;
      open?: boolean;
      createdBy: string;
    }): Position | { error: string } {
      if (!input.title.trim()) return { error: "Position title is required." };
      const now = new Date().toISOString();
      const id = randomUUID();
      const twinId = projectAcademyEntityToTwin({
        organizationId: input.organizationId,
        academyEntity: "Position",
        twinEntityType: "Document",
        id,
        label: input.title.trim(),
        kind: "position",
        actor: input.createdBy,
      });
      const position = upsertPosition({
        id,
        organizationId: input.organizationId,
        title: input.title.trim(),
        department: input.department ?? null,
        description: input.description ?? "",
        open: input.open ?? true,
        twinEntityId: twinId,
        createdAt: now,
        updatedAt: now,
        createdBy: input.createdBy,
      });
      emitWorkforceEvent({
        organizationId: input.organizationId,
        entityType: "Position",
        entityId: id,
        eventType: "position_created",
        actor: input.createdBy,
      });
      return position;
    },

    get: getPosition,
    list: listPositions,

    search(input: {
      organizationId: string;
      q?: string;
      open?: boolean;
      department?: string;
    }) {
      const q = input.q?.trim().toLowerCase();
      return Object.freeze(
        listPositions(input.organizationId).filter((p) => {
          if (input.open != null && p.open !== input.open) return false;
          if (input.department && p.department !== input.department)
            return false;
          if (!q) return true;
          return (
            p.title.toLowerCase().includes(q) ||
            (p.department?.toLowerCase().includes(q) ?? false)
          );
        })
      );
    },

    patch(input: {
      organizationId: string;
      positionId: string;
      title?: string;
      department?: string | null;
      description?: string;
      open?: boolean;
      actor: string;
    }): Position | null {
      const current = getPosition(input.organizationId, input.positionId);
      if (!current) return null;
      const next = upsertPosition({
        ...current,
        title: input.title?.trim() || current.title,
        department:
          input.department !== undefined ? input.department : current.department,
        description: input.description ?? current.description,
        open: input.open ?? current.open,
        updatedAt: new Date().toISOString(),
      });
      emitWorkforceEvent({
        organizationId: input.organizationId,
        entityType: "Position",
        entityId: next.id,
        eventType: "position_updated",
        actor: input.actor,
      });
      return next;
    },
  };
}
