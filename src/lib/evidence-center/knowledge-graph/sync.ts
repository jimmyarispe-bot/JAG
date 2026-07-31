/**
 * Synchronize Evidence Catalog™ records into the Knowledge Graph™.
 * Explicit edges only — no inference.
 */

import type { EvidenceDocument, EvidenceRelationship, RelationshipType } from "@/lib/evidence-center/types";
import {
  createKnowledgeGraphEdge,
  ensureOrganizationScaffold,
  upsertKnowledgeGraphNode,
} from "@/lib/evidence-center/knowledge-graph/service";
import type { KnowledgeGraphRelationshipType } from "@/lib/evidence-center/knowledge-graph/types";
import { knowledgeGraphNodeId } from "@/lib/evidence-center/knowledge-graph/ids";

const EVIDENCE_REL_TO_GRAPH: Readonly<
  Record<RelationshipType, KnowledgeGraphRelationshipType>
> = {
  Related: "ASSOCIATED_WITH",
  Supports: "SUPPORTED_BY",
  Supersedes: "SUPERSEDES",
  References: "REFERENCES",
  "Derived From": "GENERATED_FROM",
};

export function syncEvidenceDocumentToGraph(
  document: EvidenceDocument
): ReturnType<typeof upsertKnowledgeGraphNode> {
  const { organization } = ensureOrganizationScaffold({
    organizationId: document.organizationId,
    organizationName: document.organizationName,
  });

  const evidenceNode = upsertKnowledgeGraphNode({
    organizationId: document.organizationId,
    nodeType: "Evidence",
    label: document.name,
    externalKey: document.id,
    externalId: document.id,
    metadata: {
      domain: document.domain,
      evidenceType: document.evidenceType,
      source: document.source,
      status: document.status,
      reportingPeriod: document.reportingPeriodLabel,
    },
  });

  createKnowledgeGraphEdge({
    organizationId: document.organizationId,
    fromNodeId: evidenceNode.id,
    toNodeId: organization.id,
    relationshipType: "BELONGS_TO",
  });

  if (document.businessUnit?.trim()) {
    const bu = upsertKnowledgeGraphNode({
      organizationId: document.organizationId,
      nodeType: "Business Unit",
      label: document.businessUnit.trim(),
      externalKey: document.businessUnit.trim(),
      metadata: { kind: "business_unit" },
    });
    createKnowledgeGraphEdge({
      organizationId: document.organizationId,
      fromNodeId: evidenceNode.id,
      toNodeId: bu.id,
      relationshipType: "ASSOCIATED_WITH",
    });
    createKnowledgeGraphEdge({
      organizationId: document.organizationId,
      fromNodeId: bu.id,
      toNodeId: organization.id,
      relationshipType: "BELONGS_TO",
    });
  }

  if (document.department?.trim()) {
    const dept = upsertKnowledgeGraphNode({
      organizationId: document.organizationId,
      nodeType: "Department",
      label: document.department.trim(),
      externalKey: document.department.trim(),
      metadata: { kind: "department" },
    });
    createKnowledgeGraphEdge({
      organizationId: document.organizationId,
      fromNodeId: evidenceNode.id,
      toNodeId: dept.id,
      relationshipType: "ASSOCIATED_WITH",
    });
  }

  if (document.source === "QuickBooks") {
    registerConnectorEvidenceInGraph(document, "quickbooks-online");
  }
  if (document.source === "Google Workspace") {
    registerConnectorEvidenceInGraph(document, "google-workspace");
  }

  return evidenceNode;
}

export function syncEvidenceRelationshipToGraph(
  relationship: EvidenceRelationship
): void {
  const graphType = EVIDENCE_REL_TO_GRAPH[relationship.relationshipType];
  if (!graphType) return;

  const fromId = knowledgeGraphNodeId(
    relationship.organizationId,
    "Evidence",
    relationship.fromDocumentId
  );
  const toId = knowledgeGraphNodeId(
    relationship.organizationId,
    "Evidence",
    relationship.toDocumentId
  );

  createKnowledgeGraphEdge({
    organizationId: relationship.organizationId,
    fromNodeId: fromId,
    toNodeId: toId,
    relationshipType: graphType,
    metadata: {
      evidenceRelationshipId: relationship.id,
      catalogType: relationship.relationshipType,
    },
  });
}

/**
 * Connectors attach a Product/system node and GENERATED_FROM edge.
 * No financial interpretation — registration only.
 */
export function registerConnectorEvidenceInGraph(
  document: EvidenceDocument,
  connectorId: string
): void {
  const connectorLabel =
    connectorId === "quickbooks-online"
      ? "QuickBooks Online"
      : connectorId === "google-workspace"
        ? "Google Workspace"
        : connectorId;

  const product = upsertKnowledgeGraphNode({
    organizationId: document.organizationId,
    nodeType: "Product",
    label: connectorLabel,
    externalKey: connectorId,
    metadata: {
      connectorId,
      kind: "connector",
    },
  });

  const evidenceNodeId = knowledgeGraphNodeId(
    document.organizationId,
    "Evidence",
    document.id
  );

  createKnowledgeGraphEdge({
    organizationId: document.organizationId,
    fromNodeId: evidenceNodeId,
    toNodeId: product.id,
    relationshipType: "GENERATED_FROM",
    metadata: { connectorId },
  });

  const orgId = knowledgeGraphNodeId(
    document.organizationId,
    "Organization",
    document.organizationId
  );
  createKnowledgeGraphEdge({
    organizationId: document.organizationId,
    fromNodeId: product.id,
    toNodeId: orgId,
    relationshipType: "ASSOCIATED_WITH",
    metadata: { connectorId },
  });
}
