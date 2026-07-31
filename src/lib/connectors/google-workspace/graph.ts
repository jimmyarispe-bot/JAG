/**
 * Register non-evidence Google Workspace metadata as placeholder KG nodes.
 */

import {
  createKnowledgeGraphEdge,
  knowledgeGraphNodeId,
  upsertKnowledgeGraphNode,
} from "@/lib/evidence-center";
import type {
  GwsCalendarEventMeta,
  GwsContactMeta,
  GwsGmailMeta,
} from "@/lib/connectors/google-workspace/types";
import { GWS_CONNECTOR_ID } from "@/lib/connectors/google-workspace/types";

export function registerCalendarEventNode(
  organizationId: string,
  event: GwsCalendarEventMeta
): void {
  const node = upsertKnowledgeGraphNode({
    organizationId,
    nodeType: "Event",
    label: event.summary,
    externalKey: event.id,
    externalId: event.id,
    metadata: {
      connectorId: GWS_CONNECTOR_ID,
      calendarId: event.calendarId,
      start: event.start,
      end: event.end,
      status: event.status,
      kind: "calendar_event",
    },
  });
  const productId = knowledgeGraphNodeId(
    organizationId,
    "Product",
    GWS_CONNECTOR_ID
  );
  upsertKnowledgeGraphNode({
    organizationId,
    nodeType: "Product",
    label: "Google Workspace",
    externalKey: GWS_CONNECTOR_ID,
    metadata: { connectorId: GWS_CONNECTOR_ID, kind: "connector" },
  });
  createKnowledgeGraphEdge({
    organizationId,
    fromNodeId: node.id,
    toNodeId: productId,
    relationshipType: "GENERATED_FROM",
    metadata: { connectorId: GWS_CONNECTOR_ID },
  });
}

export function registerGmailCommunicationNode(
  organizationId: string,
  message: GwsGmailMeta
): void {
  const node = upsertKnowledgeGraphNode({
    organizationId,
    nodeType: "Communication",
    label: message.subject || "(no subject)",
    externalKey: message.id,
    externalId: message.id,
    metadata: {
      connectorId: GWS_CONNECTOR_ID,
      from: message.from,
      to: message.to,
      timestamp: message.timestamp,
      labels: message.labels.join(","),
      kind: "gmail_metadata",
    },
  });
  const productId = knowledgeGraphNodeId(
    organizationId,
    "Product",
    GWS_CONNECTOR_ID
  );
  createKnowledgeGraphEdge({
    organizationId,
    fromNodeId: node.id,
    toNodeId: productId,
    relationshipType: "ASSOCIATED_WITH",
    metadata: { connectorId: GWS_CONNECTOR_ID },
  });
}

export function registerContactPersonNode(
  organizationId: string,
  contact: GwsContactMeta
): void {
  const node = upsertKnowledgeGraphNode({
    organizationId,
    nodeType: "Person",
    label: contact.displayName,
    externalKey: contact.id,
    externalId: contact.id,
    metadata: {
      connectorId: GWS_CONNECTOR_ID,
      email: contact.email ?? "",
      organization: contact.organization ?? "",
      kind: "contact_metadata",
    },
  });
  const orgNode = upsertKnowledgeGraphNode({
    organizationId,
    nodeType: "Organization",
    label: organizationId,
    externalKey: organizationId,
    externalId: organizationId,
    metadata: { kind: "organization" },
  });
  createKnowledgeGraphEdge({
    organizationId,
    fromNodeId: node.id,
    toNodeId: orgNode.id,
    relationshipType: "ASSOCIATED_WITH",
    metadata: { connectorId: GWS_CONNECTOR_ID },
  });
}
