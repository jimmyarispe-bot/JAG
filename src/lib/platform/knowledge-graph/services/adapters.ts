/**
 * Adapters — accept existing connector KG bundles (canonical only).
 * Never call vendor APIs.
 */

import type { DomainGraphBundle } from "@/lib/platform/knowledge-graph/graph-store/ingest";
import { buildCrmKnowledgeGraph } from "@/lib/platform/integrations/connectors/crm/mapping";
import { crmStore } from "@/lib/platform/integrations/connectors/crm/services/store";
import { buildHrKnowledgeGraph } from "@/lib/platform/integrations/connectors/hr/mapping";
import { hrStore } from "@/lib/platform/integrations/connectors/hr/services/store";
import { buildFinanceKnowledgeGraph } from "@/lib/platform/integrations/connectors/finance/mapping";
import { financeStore } from "@/lib/platform/integrations/connectors/finance/services/store";
import { buildEducationKnowledgeGraph } from "@/lib/platform/integrations/connectors/education/mapping";
import { educationStore } from "@/lib/platform/integrations/connectors/education/services/store";
import { buildEnterpriseKnowledgeGraph } from "@/lib/platform/integrations/connectors/enterprise/mapping";
import { enterpriseStore } from "@/lib/platform/integrations/connectors/enterprise/services/store";
import { buildCollaborationKnowledgeGraph } from "@/lib/platform/integrations/connectors/collaboration/mapping";
import { collaborationStore } from "@/lib/platform/integrations/connectors/collaboration/services/store";

function toBundle(
  domain: string,
  graph: { nodes: Array<{ nodeId: string; entityType: string; label: string; properties?: Record<string, unknown> }>; relationships: Array<{ relationshipId: string; type: string; fromNodeId: string; toNodeId: string }> }
): DomainGraphBundle {
  return {
    domain,
    nodes: graph.nodes.map((n) => ({
      nodeId: n.nodeId,
      entityType: n.entityType,
      label: n.label,
      properties: n.properties,
    })),
    edges: graph.relationships.map((r) => ({
      relationshipId: r.relationshipId,
      type: r.type,
      fromNodeId: r.fromNodeId,
      toNodeId: r.toNodeId,
    })),
  };
}

/** Collect domain KG bundles from connector normalized stores (soft-read). */
export function collectDomainBundles(organizationId: string): DomainGraphBundle[] {
  const bundles: DomainGraphBundle[] = [];

  const crm = crmStore.allRecords(organizationId);
  if (crm.length) bundles.push(toBundle("crm", buildCrmKnowledgeGraph(crm)));

  const hr = hrStore.allRecords(organizationId);
  if (hr.length) bundles.push(toBundle("hr", buildHrKnowledgeGraph(hr)));

  const finance = financeStore.allRecords(organizationId);
  if (finance.length) {
    bundles.push(toBundle("finance", buildFinanceKnowledgeGraph(finance)));
  }

  const education = educationStore.allRecords(organizationId);
  if (education.length) {
    bundles.push(toBundle("education", buildEducationKnowledgeGraph(education)));
  }

  const enterprise = enterpriseStore.allRecords(organizationId);
  if (enterprise.length) {
    bundles.push(toBundle("enterprise", buildEnterpriseKnowledgeGraph(enterprise)));
  }

  const collaboration = collaborationStore.allRecords(organizationId);
  if (collaboration.length) {
    bundles.push(
      toBundle("collaboration", buildCollaborationKnowledgeGraph(collaboration))
    );
  }

  return bundles;
}
