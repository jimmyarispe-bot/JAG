/**
 * Multi-entity financial structure.
 */

import { randomUUID } from "node:crypto";
import { recordFinanceAudit } from "../audit";
import { requireFinancePermission } from "../permissions";
import {
  getEntity,
  listEntities,
  listLinks,
  upsertEntity,
  upsertLink,
} from "../store";
import type { EntityKind, FinanceEntity, IntercompanyLink } from "../types";

export function createFinanceEntity(input: {
  organizationId: string;
  userId: string;
  name: string;
  kind: EntityKind;
  parentEntityId?: string | null;
  currency?: string;
  intercompany?: boolean;
}): FinanceEntity | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "create",
  });
  if ("error" in gate) return gate;

  if (input.parentEntityId && !getEntity(input.parentEntityId)) {
    return { error: "Parent entity not found." };
  }

  const entity = upsertEntity({
    id: `fent:${randomUUID()}`,
    organizationId: input.organizationId,
    name: input.name,
    kind: input.kind,
    parentEntityId: input.parentEntityId ?? null,
    currency: input.currency ?? "USD",
    active: true,
    intercompany: input.intercompany === true,
    createdAt: new Date().toISOString(),
  });
  recordFinanceAudit({
    organizationId: input.organizationId,
    action: "entity.create",
    recordType: "entity",
    recordId: entity.id,
    userId: input.userId,
    newValue: entity,
  });
  return entity;
}

export function linkIntercompany(input: {
  organizationId: string;
  userId: string;
  fromEntityId: string;
  toEntityId: string;
  relationship: string;
}): IntercompanyLink | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "create",
  });
  if ("error" in gate) return gate;
  if (!getEntity(input.fromEntityId) || !getEntity(input.toEntityId)) {
    return { error: "Both entities must exist." };
  }
  const link = upsertLink({
    id: `ic:${randomUUID()}`,
    organizationId: input.organizationId,
    fromEntityId: input.fromEntityId,
    toEntityId: input.toEntityId,
    relationship: input.relationship,
  });
  recordFinanceAudit({
    organizationId: input.organizationId,
    action: "entity.intercompany_link",
    recordType: "intercompany",
    recordId: link.id,
    userId: input.userId,
    newValue: link,
  });
  return link;
}

export { listEntities, listLinks, getEntity };
