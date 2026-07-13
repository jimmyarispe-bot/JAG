import type { ValuesAlignmentEngineContract } from "@/lib/platform/intelligence/ethical/contracts";
import type { ValuesAlignmentSuite } from "@/lib/platform/intelligence/ethical/types";

export class ValuesAlignmentEngine implements ValuesAlignmentEngineContract {
  assess(input: Parameters<ValuesAlignmentEngineContract["assess"]>[0]): ValuesAlignmentSuite {
    const suite = input.areas.values_alignment;
    const records = suite.records.map(record => ({
      id: input.createId("eth-values"),
      title: record.title,
      alignment: record.score,
      lenses: record.lenses,
      narrative: `Values alignment: ${record.title} at ${Math.round(record.score)}.`,
    }));
    return {
      records,
      score: suite.score,
      valuesIndex: input.baseline.valuesAlignment,
      narrative: `Values alignment suite index ${Math.round(input.baseline.valuesAlignment)}.`,
    };
  }
}
