/**
 * Knowledge graph relationship extension points.
 */

import type {
  CanonicalEntity,
  GraphNodeHint,
  GraphRelationshipHint,
} from "@/lib/platform/integrations/types";

export type RelationshipHintInput = {
  type: string;
  from: CanonicalEntity | GraphNodeHint;
  to: CanonicalEntity | GraphNodeHint;
  properties?: Record<string, unknown>;
};

export class GraphRelationshipBuilder {
  private seq = 0;

  build(input: RelationshipHintInput): GraphRelationshipHint {
    return {
      relationshipId: `rel-${++this.seq}`,
      type: input.type,
      fromNodeId: resolveNodeId(input.from),
      toNodeId: resolveNodeId(input.to),
      properties: input.properties,
    };
  }

  buildMany(inputs: readonly RelationshipHintInput[]): GraphRelationshipHint[] {
    return inputs.map((input) => this.build(input));
  }
}

function resolveNodeId(value: CanonicalEntity | GraphNodeHint): string {
  if ("nodeId" in value) return value.nodeId;
  return `node:${value.identityKey}`;
}

export function createGraphRelationshipBuilder(): GraphRelationshipBuilder {
  return new GraphRelationshipBuilder();
}
