import { recordGraphEdge } from "@/lib/platform/intelligence-graph/persistence/records";
import type { UlrRelationship } from "@/lib/platform/ulr/types";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import { buildGraphNodeId } from "@/lib/platform/intelligence-graph/utils";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

const ULR_TO_GRAPH_EDGE: Partial<Record<UlrRelationship["relationshipType"], string>> = {
  prerequisite: "ulr.prerequisite",
  next_in_sequence: "ulr.next_in_sequence",
  related: "ulr.related",
  cross_domain: "ulr.cross_domain",
  assessment: "assessment.measures.competency",
  evidence: "competency.supported_by.evidence",
  parent_support: "ulr.parent_support",
  teacher_guidance: "ulr.teacher_guidance",
  ai_rule: "rule.evaluated_during.decision",
};

function registryKindToNodeType(kind: UlrRelationship["sourceKind"]): string {
  switch (kind) {
    case "competency":
      return "competency";
    case "skill":
      return "atomic_skill";
    case "domain":
      return "learning_domain";
    default:
      return "entity";
  }
}

function buildNodeId(kind: UlrRelationship["sourceKind"], key: string): string {
  if (kind === "competency") return buildGraphNodeId("competency", "competency", key);
  if (kind === "skill") return buildGraphNodeId("atomic_skill", "atomic_skill", key);
  if (kind === "domain") return buildGraphNodeId("learning_domain", "learning_domain", key);
  return buildGraphNodeId("entity", kind, key);
}

/** Sync ULR relationship to Intelligence Graph persisted edges. */
export async function syncUlrRelationshipToGraph(
  supabase: AuthClient,
  relationship: UlrRelationship
): Promise<void> {
  const edgeType = ULR_TO_GRAPH_EDGE[relationship.relationshipType] ?? "ulr.related";

  await recordGraphEdge(supabase, {
    edgeType,
    sourceNodeId: buildNodeId(relationship.sourceKind, relationship.sourceKey),
    targetNodeId: buildNodeId(relationship.targetKind, relationship.targetKey),
    providerKey: "persisted",
    weight: relationship.weight ?? 1,
    metadata: {
      ulrRelationshipType: relationship.relationshipType,
      sourceKind: relationship.sourceKind,
      targetKind: relationship.targetKind,
      ...relationship.metadata,
    },
  });
}

export { registryKindToNodeType };
