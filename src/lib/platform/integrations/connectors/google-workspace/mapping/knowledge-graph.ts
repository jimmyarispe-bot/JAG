/**
 * Knowledge graph mapping — Person, Meeting, Communication, Document, Task, Organization.
 * Operates on canonical entities only; never raw Google payloads.
 */

import type { CanonicalEntity, GraphNodeHint, GraphRelationshipHint } from "@/lib/platform/integrations/types";
import {
  createGraphEntityBuilder,
  createGraphRelationshipBuilder,
} from "@/lib/platform/integrations/graph";
import type {
  GoogleWorkspaceCanonicalEntity,
  GoogleWorkspaceKgKind,
} from "@/lib/platform/integrations/connectors/google-workspace/entities";
import { GOOGLE_WORKSPACE_KG_KINDS } from "@/lib/platform/integrations/connectors/google-workspace/entities";
import { googleWorkspaceKgKind } from "@/lib/platform/integrations/connectors/google-workspace/mapping/canonical";

function resolveKgKind(record: GoogleWorkspaceCanonicalEntity): GoogleWorkspaceKgKind {
  const attrKind = record.attributes.kind;
  if (
    typeof attrKind === "string" &&
    (GOOGLE_WORKSPACE_KG_KINDS as readonly string[]).includes(attrKind)
  ) {
    return attrKind as GoogleWorkspaceKgKind;
  }
  return googleWorkspaceKgKind(record.objectType) ?? "Document";
}

export type GoogleWorkspaceGraphBundle = {
  nodes: GraphNodeHint[];
  relationships: GraphRelationshipHint[];
};

export function toPlatformCanonicalEntity(
  record: GoogleWorkspaceCanonicalEntity
): CanonicalEntity {
  const kg = resolveKgKind(record);
  return {
    id: record.id,
    canonicalType: kg,
    externalId: record.externalId,
    sourceSystem: record.sourceSystem,
    connectorId: "google",
    instanceId: "google",
    data: {
      ...record.attributes,
      jagCanonicalType: record.canonicalType,
      objectType: record.objectType,
      workspaceDomain: record.workspaceDomain,
      organizationId: record.organizationId,
      userId: record.userId,
    },
    identityKey: `productivity:${kg}:${record.externalId}`.toLowerCase(),
    contentHash: record.id,
    syncedAt: record.syncedAt,
  };
}

export function buildGoogleWorkspaceGraph(
  records: readonly GoogleWorkspaceCanonicalEntity[]
): GoogleWorkspaceGraphBundle {
  const entityBuilder = createGraphEntityBuilder({
    labelFor: (entity) =>
      String(
        entity.data.name ??
          entity.data.title ??
          entity.data.subject ??
          entity.data.email ??
          entity.externalId
      ),
    // Provider-neutral ids (same scheme as Microsoft 365) for Copilot neutrality.
    nodeIdFor: (entity) => `prod:${entity.canonicalType}:${entity.externalId}`,
  });
  const relBuilder = createGraphRelationshipBuilder();

  const platformEntities = records.map(toPlatformCanonicalEntity);
  const nodes = entityBuilder.buildNodes(platformEntities);
  const relationships: GraphRelationshipHint[] = [];

  const byExternal = new Map(platformEntities.map((e) => [e.externalId, e]));

  for (const entity of platformEntities) {
    const calendarEventId = entity.data.calendarEventId;
    if (typeof calendarEventId === "string" && byExternal.has(calendarEventId)) {
      relationships.push(
        relBuilder.build({
          type: "ASSOCIATED_WITH",
          from: entity,
          to: byExternal.get(calendarEventId)!,
        })
      );
    }
    const threadId = entity.data.threadId;
    if (typeof threadId === "string" && byExternal.has(threadId)) {
      relationships.push(
        relBuilder.build({
          type: "PART_OF",
          from: entity,
          to: byExternal.get(threadId)!,
        })
      );
    }
    const messageId = entity.data.messageId;
    if (typeof messageId === "string" && byExternal.has(messageId)) {
      relationships.push(
        relBuilder.build({
          type: "PART_OF",
          from: entity,
          to: byExternal.get(messageId)!,
        })
      );
    }
    const participantEmails = entity.data.participantEmails;
    if (Array.isArray(participantEmails) && entity.canonicalType === "Email") {
      for (const email of participantEmails) {
        const personKey = `person:${String(email).toLowerCase()}`;
        const person = byExternal.get(personKey);
        if (!person) continue;
        relationships.push(
          relBuilder.build({
            type: "ASSOCIATED_WITH",
            from: entity,
            to: person,
          })
        );
      }
    }
    const meetingId = entity.data.meetingId;
    if (typeof meetingId === "string" && byExternal.has(meetingId)) {
      relationships.push(
        relBuilder.build({
          type: entity.canonicalType === "Attendee" ? "ATTENDS" : "PART_OF",
          from: entity,
          to: byExternal.get(meetingId)!,
        })
      );
    }
    if (
      entity.canonicalType === "Meeting" &&
      typeof entity.data.calendarEventId === "string" &&
      byExternal.has(String(entity.data.calendarEventId))
    ) {
      relationships.push(
        relBuilder.build({
          type: "PART_OF",
          from: entity,
          to: byExternal.get(String(entity.data.calendarEventId))!,
        })
      );
    }
    const roomId = entity.data.roomId;
    if (typeof roomId === "string" && byExternal.has(roomId)) {
      relationships.push(
        relBuilder.build({
          type: "ASSOCIATED_WITH",
          from: entity,
          to: byExternal.get(roomId)!,
        })
      );
    }
    const parentId = entity.data.parentId;
    if (
      typeof parentId === "string" &&
      byExternal.has(parentId) &&
      (entity.canonicalType === "Document" || entity.canonicalType === "Folder")
    ) {
      relationships.push(
        relBuilder.build({
          type: "PART_OF",
          from: entity,
          to: byExternal.get(parentId)!,
        })
      );
    }
    const documentId = entity.data.documentId;
    if (
      typeof documentId === "string" &&
      byExternal.has(documentId) &&
      (entity.canonicalType === "Permission" ||
        entity.canonicalType === "Revision" ||
        entity.canonicalType === "Owner")
    ) {
      relationships.push(
        relBuilder.build({
          type: entity.canonicalType === "Owner" ? "OWNS" : "PART_OF",
          from: entity,
          to: byExternal.get(documentId)!,
        })
      );
    }
    const ownerId = entity.data.ownerId;
    if (typeof ownerId === "string" && byExternal.has(ownerId)) {
      relationships.push(
        relBuilder.build({
          type: "OWNED_BY",
          from: entity,
          to: byExternal.get(ownerId)!,
        })
      );
    }
    const orgName = entity.data.organization;
    if (typeof orgName === "string" && entity.canonicalType === "Person") {
      const orgNode = nodes.find(
        (n) => n.entityType === "Organization" && n.label === orgName
      );
      if (orgNode) {
        relationships.push({
          relationshipId: `rel-works-${entity.externalId}`,
          type: "WORKS_AT",
          fromNodeId: `prod:Person:${entity.externalId}`,
          toNodeId: orgNode.nodeId,
        });
      }
    }
  }

  return { nodes, relationships };
}
