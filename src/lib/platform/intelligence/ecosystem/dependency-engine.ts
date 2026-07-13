import type { DependencyEngineContract } from "@/lib/platform/intelligence/ecosystem/contracts";
import type { DependencySuite } from "@/lib/platform/intelligence/ecosystem/types";

export class DependencyEngine implements DependencyEngineContract {
  assess(input: Parameters<DependencyEngineContract["assess"]>[0]): DependencySuite {
    const suite = input.areas.ecosystem_dependencies;
    const records = suite.records.map(record => ({
      id: input.createId("esm-dependency"),
      title: record.title,
      risk: 100 - record.score,
      lenses: record.lenses,
      narrative: `Dependency analysis: ${record.title} at ${Math.round(record.score)}.`,
    }));
    return {
      records,
      score: suite.score,
      dependencyIndex: input.baseline.dependencyRisk,
      narrative: `Dependency suite index ${Math.round(input.baseline.dependencyRisk)}.`,
    };
  }
}
