import type { TradeOffEngineContract } from "@/lib/platform/intelligence/wisdom/contracts";
import type { TradeOffSuite } from "@/lib/platform/intelligence/wisdom/types";

export class TradeOffEngine implements TradeOffEngineContract {
  assess(input: Parameters<TradeOffEngineContract["assess"]>[0]): TradeOffSuite {
    const suite = input.areas.trade_off_analysis;
    const records = suite.records.map(record => ({
      id: input.createId("wis-tradeoff"),
      title: record.title,
      balanceIndex: record.score,
      lenses: record.lenses,
      narrative: `Trade-off: ${record.title} at ${Math.round(record.score)}.`,
    }));
    return {
      records,
      score: suite.score,
      balanceIndex: input.baseline.tradeOffBalance,
      narrative: `Trade-off suite index ${Math.round(input.baseline.tradeOffBalance)}.`,
    };
  }
}
