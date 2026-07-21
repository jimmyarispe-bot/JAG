/**
 * Graph hook events — emit when normalized entities are ready for the knowledge graph.
 */

import type { EventPublisher } from "@/lib/platform/integrations/events/publisher";
import type {
  CanonicalEntity,
  GraphNodeHint,
  GraphRelationshipHint,
} from "@/lib/platform/integrations/types";

export type GraphIngestPayload = {
  connectorId: string;
  instanceId: string;
  nodes: GraphNodeHint[];
  relationships: GraphRelationshipHint[];
  entities: CanonicalEntity[];
};

export async function publishGraphIngestHints(
  publisher: EventPublisher,
  payload: GraphIngestPayload
): Promise<void> {
  await publisher.publish(
    "NORMALIZATION_COMPLETED",
    {
      graphReady: true,
      nodeCount: payload.nodes.length,
      relationshipCount: payload.relationships.length,
      entityCount: payload.entities.length,
      nodes: payload.nodes,
      relationships: payload.relationships,
    },
    {
      connectorId: payload.connectorId,
      instanceId: payload.instanceId,
    }
  );
}
