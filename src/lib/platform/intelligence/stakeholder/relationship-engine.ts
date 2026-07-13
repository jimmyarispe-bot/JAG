import type { RelationshipEngineContract } from "@/lib/platform/intelligence/stakeholder/contracts";
import type { RelationshipSuite } from "@/lib/platform/intelligence/stakeholder/types";

export class RelationshipEngine implements RelationshipEngineContract {
  assess(input: Parameters<RelationshipEngineContract["assess"]>[0]): RelationshipSuite {
    const suite = input.areas.trust_relationship;
    const records = suite.records.map(record => ({
      id: input.createId("stk-relationship"),
      title: record.title,
      strength: record.score,
      lenses: record.lenses,
      narrative: `Relationship strength: ${record.title} at ${Math.round(record.score)}.`,
    }));
    return {
      records,
      score: suite.score,
      strengthIndex: input.baseline.relationshipStrength,
      narrative: `Relationship suite strength index ${Math.round(input.baseline.relationshipStrength)}.`,
    };
  }
}
