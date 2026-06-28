import {
  getProfileKindDefinition,
  getProfileSections,
  getRegisteredProfileKinds,
} from "@/lib/platform/profile/registry";
import type { ProfileKind } from "@/lib/platform/profile/types";
import type {
  EdgeResolveOptions,
  GraphEdge,
  GraphNode,
  GraphProvider,
  GraphProviderContext,
  GraphSearchQuery,
} from "@/lib/platform/intelligence-graph/types";
import { buildGraphNodeId } from "@/lib/platform/intelligence-graph/utils";

const PROFILE_ENTITY_KINDS: Record<string, ProfileKind> = {
  student: "student",
  employee: "employee",
  family: "family",
  admissions_lead: "admissions_case",
};

/** Graph provider backed by Platform Profiles — links profile sections to entity profiles. */
export const profileGraphProvider: GraphProvider = {
  providerKey: "profile",

  async resolveNode(
    _ctx: GraphProviderContext,
    entityType: string,
    entityId: string
  ): Promise<GraphNode | null> {
    const kind = PROFILE_ENTITY_KINDS[entityType];
    if (!kind || !entityId) return null;

    const kindDef = getProfileKindDefinition(kind);
    if (!kindDef) return null;

    return {
      nodeId: buildGraphNodeId("profile", entityType, entityId),
      nodeType: "profile",
      entityType,
      entityId,
      organizationId: null,
      schoolId: null,
      metadata: {
        providerKey: "profile",
        profileKind: kind,
        label: kindDef.label,
      },
    };
  },

  async resolveEdges(
    _ctx: GraphProviderContext,
    node: GraphNode,
    _options?: EdgeResolveOptions
  ): Promise<GraphEdge[]> {
    if (node.nodeType === "entity") {
      const kind = PROFILE_ENTITY_KINDS[node.entityType];
      if (!kind) return [];

      const profileNodeId = buildGraphNodeId("profile", node.entityType, node.entityId);
      const sections = getProfileSections(kind);

      return sections.map((section) => ({
        edgeType: "profile.sections",
        sourceNode: profileNodeId,
        targetNode: buildGraphNodeId("entity", node.entityType, `${node.entityId}#${section.key}`),
        direction: "directed" as const,
        weight: section.pinned ? 1 : 0.5,
        effectiveDate: null,
        endDate: null,
        metadata: {
          providerKey: "profile",
          profileKind: kind,
          sectionKey: section.key,
          sectionLabel: section.label,
        },
      }));
    }

    if (node.nodeType === "profile") {
      const kind = PROFILE_ENTITY_KINDS[node.entityType];
      if (!kind) return [];

      return [
        {
          edgeType: "profile.sections",
          sourceNode: node.nodeId,
          targetNode: buildGraphNodeId("entity", node.entityType, node.entityId),
          direction: "directed",
          weight: 1,
          effectiveDate: null,
          endDate: null,
          metadata: {
            providerKey: "profile",
            profileKind: kind,
          },
        },
      ];
    }

    return [];
  },

  async searchNodes(_ctx: GraphProviderContext, query: GraphSearchQuery): Promise<GraphNode[]> {
    const needle = query.query.toLowerCase();
    if (!needle) return [];

    const nodes: GraphNode[] = [];

    for (const kind of getRegisteredProfileKinds()) {
      const kindDef = getProfileKindDefinition(kind);
      if (!kindDef) continue;

      const entityType = Object.entries(PROFILE_ENTITY_KINDS).find(([, k]) => k === kind)?.[0];
      if (!entityType) continue;

      if (
        kindDef.label.toLowerCase().includes(needle) ||
        kind.toLowerCase().includes(needle)
      ) {
        nodes.push({
          nodeId: buildGraphNodeId("profile", entityType, `search:${kind}`),
          nodeType: "profile",
          entityType,
          entityId: `search:${kind}`,
          organizationId: query.organizationId ?? null,
          schoolId: query.schoolId ?? null,
          metadata: {
            providerKey: "profile",
            profileKind: kind,
            label: kindDef.label,
            searchResult: true,
          },
        });
      }
    }

    return nodes.slice(0, query.limit ?? 20);
  },
};
