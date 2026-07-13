import type { NarrativeAnalysisEngineContract } from "@/lib/platform/intelligence/reputation/contracts";
import type { NarrativeAnalysisSuite } from "@/lib/platform/intelligence/reputation/types";

export class NarrativeAnalysisEngine implements NarrativeAnalysisEngineContract {
  assess(input: Parameters<NarrativeAnalysisEngineContract["assess"]>[0]): NarrativeAnalysisSuite {
    const suite = input.areas.social_narrative;
    const records = suite.records.map(record => ({
      id: input.createId("rep-narrative"),
      title: record.title,
      momentum: record.score,
      lenses: record.lenses,
      narrative: `Narrative: ${record.title} at ${Math.round(record.score)}.`,
    }));
    return {
      records,
      score: suite.score,
      momentumIndex: input.baseline.narrativeMomentum,
      narrative: `Narrative analysis suite momentum ${Math.round(input.baseline.narrativeMomentum)}.`,
    };
  }
}
