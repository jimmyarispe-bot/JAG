import type { KnowledgeGraphNodeType } from "@/lib/evidence-center/knowledge-graph/types";

/** Stable node ids — reuse domain identifiers where possible. */
export function knowledgeGraphNodeId(
  organizationId: string,
  nodeType: KnowledgeGraphNodeType,
  externalKey: string
): string {
  const key = externalKey.trim().toLowerCase().replace(/\s+/g, "-");
  switch (nodeType) {
    case "Organization":
      return `kg:org:${organizationId}`;
    case "Evidence":
      return `kg:evidence:${externalKey}`;
    case "Product":
      return `kg:product:${organizationId}:${key}`;
    case "Business Unit":
      return `kg:bu:${organizationId}:${key}`;
    case "Department":
      return `kg:dept:${organizationId}:${key}`;
    case "Person":
      return `kg:person:${organizationId}:${key}`;
    case "Project":
      return `kg:project:${organizationId}:${key}`;
    case "Goal":
      return `kg:goal:${organizationId}:${key}`;
    case "KPI":
      return `kg:kpi:${organizationId}:${key}`;
    case "Event":
      return `kg:event:${organizationId}:${key}`;
    case "Communication":
      return `kg:communication:${organizationId}:${key}`;
    case "Team":
      return `kg:team:${organizationId}:${key}`;
    case "Role":
      return `kg:role:${organizationId}:${key}`;
    case "Asset":
      return `kg:asset:${organizationId}:${key}`;
    case "Location":
      return `kg:location:${organizationId}:${key}`;
    case "Task":
      return `kg:task:${organizationId}:${key}`;
    case "Document":
      return `kg:document:${organizationId}:${key}`;
    case "Decision":
      return `kg:decision:${organizationId}:${key}`;
    case "Risk":
      return `kg:risk:${organizationId}:${key}`;
    case "Opportunity":
      return `kg:opportunity:${organizationId}:${key}`;
  }
}
