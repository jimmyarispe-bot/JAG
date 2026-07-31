import type { KnowledgeGraphNodeType } from "@/lib/evidence-center/knowledge-graph/types";
import type { KnowledgeGraphRelationshipType } from "@/lib/evidence-center/knowledge-graph/types";
import type {
  TwinEntityType,
  TwinRelationshipType,
} from "@/lib/digital-twin/types";

export function twinTypeToGraphType(
  entityType: TwinEntityType
): KnowledgeGraphNodeType {
  switch (entityType) {
    case "Organization":
      return "Organization";
    case "Person":
      return "Person";
    case "Team":
      return "Team";
    case "Business Unit":
      return "Business Unit";
    case "Department":
      return "Department";
    case "Role":
      return "Role";
    case "Asset":
      return "Asset";
    case "Location":
      return "Location";
    case "Product / Service":
      return "Product";
    case "Project":
      return "Project";
    case "Task":
      return "Task";
    case "Event":
      return "Event";
    case "Document":
      return "Document";
    case "Decision":
      return "Decision";
    case "Goal":
      return "Goal";
    case "Metric (KPI)":
      return "KPI";
    case "Risk":
      return "Risk";
    case "Opportunity":
      return "Opportunity";
  }
}

export function twinRelationshipToGraphType(
  relationshipType: TwinRelationshipType
): KnowledgeGraphRelationshipType {
  switch (relationshipType) {
    case "reports_to":
      return "REPORTS_TO";
    case "belongs_to":
      return "BELONGS_TO";
    case "owns":
      return "OWNS";
    case "manages":
      return "MANAGES";
    case "assigned_to":
      return "ASSIGNED_TO";
    case "participates_in":
      return "PARTICIPATES_IN";
    case "located_at":
      return "LOCATED_AT";
    case "depends_on":
      return "DEPENDS_ON";
    case "supports":
      return "SUPPORTS";
    case "measures":
      return "MEASURES";
    case "created_from":
      return "CREATED_FROM";
    case "references":
      return "REFERENCES";
    case "measured_by":
      return "MEASURED_BY";
    case "blocked_by":
      return "BLOCKED_BY";
    case "owned_by":
      return "OWNED_BY";
    case "threatens":
      return "THREATENS";
    case "mitigated_by":
      return "MITIGATED_BY";
    case "controlled_by":
      return "CONTROLLED_BY";
    case "impacts":
      return "IMPACTS";
    case "monitored_by":
      return "MONITORED_BY";
    case "blocks":
      return "BLOCKS";
    case "produces":
      return "PRODUCES";
    case "documents":
      return "DOCUMENTS";
    case "explains":
      return "EXPLAINS";
    case "resulted_from":
      return "RESULTED_FROM";
  }
}
