import type { KnowledgeGraphEngineContract } from "@/lib/platform/intelligence/institutional-memory/contracts";
import type { KnowledgeGraphSuite } from "@/lib/platform/intelligence/institutional-memory/types";

export class KnowledgeGraphEngine implements KnowledgeGraphEngineContract {
  assess(input: Parameters<KnowledgeGraphEngineContract["assess"]>[0]): KnowledgeGraphSuite {
    const suite = input.areas.knowledge_graph;
    const records = suite.records.map(record => ({
      id: input.createId("imm-graph"),
      title: record.title,
      connectivity: record.score,
      lenses: record.lenses,
      narrative: `Knowledge graph: ${record.title} at ${Math.round(record.score)}.`,
    }));
    return {
      records,
      score: suite.score,
      graphIndex: input.baseline.institutionalMemoryCoverage,
      narrative: `Knowledge graph suite index ${Math.round(input.baseline.institutionalMemoryCoverage)}.`,
    };
  }
}
