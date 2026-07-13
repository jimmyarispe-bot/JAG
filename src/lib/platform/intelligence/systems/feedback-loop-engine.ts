import type { FeedbackLoopEngineContract } from "@/lib/platform/intelligence/systems/contracts";
import type { FeedbackLoopSuite } from "@/lib/platform/intelligence/systems/types";

export class FeedbackLoopEngine implements FeedbackLoopEngineContract {
  assess(input: Parameters<FeedbackLoopEngineContract["assess"]>[0]): FeedbackLoopSuite {
    const suite = input.areas.feedback_loop_analysis;
    const records = suite.records.map(record => ({
      id: input.createId("sys-feedback"),
      title: record.title,
      stability: record.score,
      lenses: record.lenses,
      narrative: `Feedback loop analysis: ${record.title} at ${Math.round(record.score)}.`,
    }));
    return {
      records,
      score: suite.score,
      feedbackIndex: input.baseline.feedbackStability,
      narrative: `Feedback loop suite index ${Math.round(input.baseline.feedbackStability)}.`,
    };
  }
}
