import type { DependencyEngineContract } from "@/lib/platform/intelligence/systems/contracts";
import type { DependencySuite } from "@/lib/platform/intelligence/systems/types";

export class DependencyEngine implements DependencyEngineContract {
  assess(input: Parameters<DependencyEngineContract["assess"]>[0]): DependencySuite {
    const suite = input.areas.dependency_analysis;
    const records = suite.records.map(record => ({
      id: input.createId("sys-dependency"),
      title: record.title,
      strength: record.score,
      lenses: record.lenses,
      narrative: `Dependency analysis: ${record.title} at ${Math.round(record.score)}.`,
    }));
    return {
      records,
      score: suite.score,
      dependencyIndex: input.baseline.dependencyImpact,
      narrative: `Dependency suite index ${Math.round(input.baseline.dependencyImpact)}.`,
    };
  }
}
