import type { ExecutiveJudgmentEngineContract } from "@/lib/platform/intelligence/wisdom/contracts";
import type { ExecutiveJudgmentFramework, ExecutiveJudgmentSuite } from "@/lib/platform/intelligence/wisdom/types";

export class ExecutiveJudgmentEngine implements ExecutiveJudgmentEngineContract {
  assess(input: Parameters<ExecutiveJudgmentEngineContract["assess"]>[0]): ExecutiveJudgmentSuite {
    const suite = input.areas.executive_judgment;
    const framework: ExecutiveJudgmentFramework = {
      whatLeadershipShouldDo: "Prioritize the weakest wisdom areas with the highest long-term impact.",
      why: `Executive judgment scored ${Math.round(suite.score)} against a wisdom baseline of ${Math.round(input.baseline.wisdomScore)}.`,
      whyNow: "Judgment windows compress when confidence calibration and trade-off balance drift.",
      whyNotAlternatives: "Deferring or over-optimizing near-term metrics raises short-termism and opportunity-cost blindness.",
      risksRemaining: "Residual uncertainty, ethical compromise pressure, and institutional wisdom erosion.",
      assumptions: "Collective, ethical, and predictive soft signals remain directionally valid.",
      evidence: suite.records.map(r => r.signal).join("; "),
      expectedOutcome: "Higher wisdomScore with clearer strategic timing and validated recommendations.",
    };
    const records = suite.records.map(record => ({
      id: input.createId("wis-judgment"),
      title: record.title,
      judgmentIndex: record.score,
      lenses: record.lenses,
      framework,
      narrative: `Executive judgment: ${record.title} at ${Math.round(record.score)}.`,
    }));
    return {
      records,
      score: suite.score,
      judgmentIndex: input.baseline.wisdomScore,
      framework,
      narrative: `Executive judgment suite index ${Math.round(input.baseline.wisdomScore)}.`,
    };
  }
}
