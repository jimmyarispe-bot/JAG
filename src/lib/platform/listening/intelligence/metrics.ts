import {
  extractNumberFromAnswerValue,
  extractOptionKey,
  extractOptionKeys,
  extractTextFromAnswerValue,
} from "./normalize";
import type { ListeningCampaignMetrics, ListeningQuestionMetrics } from "./types";

export type ListeningAnswerRow = {
  readonly id: string;
  readonly response_id: string;
  readonly question_id: string;
  readonly question_type: string;
  readonly value: unknown;
};

export type ListeningQuestionRow = {
  readonly id: string;
  readonly question_type: string;
  readonly prompt: string;
  readonly required: boolean;
  readonly options?: readonly {
    readonly option_key: string;
    readonly label: string;
  }[];
};

export type ListeningResponseRow = {
  readonly id: string;
  readonly status: string;
};

export function computeCampaignMetrics(input: {
  readonly responses: readonly ListeningResponseRow[];
  readonly questions: readonly ListeningQuestionRow[];
  readonly answers: readonly ListeningAnswerRow[];
}): ListeningCampaignMetrics {
  const submitted = input.responses.filter((r) => r.status === "submitted");
  const completionCount = submitted.length;
  const questionCount = input.questions.length;

  const answersByResponse = new Map<string, ListeningAnswerRow[]>();
  for (const a of input.answers) {
    const list = answersByResponse.get(a.response_id) ?? [];
    list.push(a);
    answersByResponse.set(a.response_id, list);
  }

  let fillSum = 0;
  let textLenSum = 0;
  let textLenCount = 0;

  for (const response of submitted) {
    const answered = answersByResponse.get(response.id) ?? [];
    fillSum +=
      questionCount === 0 ? 0 : answered.length / questionCount;
    for (const a of answered) {
      const text = extractTextFromAnswerValue(a.value);
      if (text != null) {
        textLenSum += text.trim().length;
        textLenCount += 1;
      }
    }
  }

  const completionRate =
    completionCount === 0 ? 0 : fillSum / completionCount;
  const averageResponseLength =
    textLenCount === 0 ? 0 : textLenSum / textLenCount;

  const questionCompletion: ListeningQuestionMetrics[] = input.questions.map(
    (q) => {
      const qAnswers = input.answers.filter((a) => a.question_id === q.id);
      const answeredCount = qAnswers.length;
      const completionRateQ =
        completionCount === 0 ? 0 : answeredCount / completionCount;

      const base: ListeningQuestionMetrics = {
        questionId: q.id,
        questionType: q.question_type,
        prompt: q.prompt,
        answeredCount,
        completionRate: completionRateQ,
      };

      if (q.question_type === "short_text" || q.question_type === "long_text") {
        const lengths = qAnswers
          .map((a) => extractTextFromAnswerValue(a.value)?.trim().length ?? 0)
          .filter((n) => n > 0);
        return {
          ...base,
          averageTextLength:
            lengths.length === 0
              ? 0
              : lengths.reduce((s, n) => s + n, 0) / lengths.length,
        };
      }

      if (
        q.question_type === "single_choice" ||
        q.question_type === "multi_choice"
      ) {
        const dist: Record<string, number> = {};
        for (const a of qAnswers) {
          if (q.question_type === "single_choice") {
            const key = extractOptionKey(a.value);
            if (key) dist[key] = (dist[key] ?? 0) + 1;
          } else {
            for (const key of extractOptionKeys(a.value)) {
              dist[key] = (dist[key] ?? 0) + 1;
            }
          }
        }
        return { ...base, choiceDistribution: dist };
      }

      if (q.question_type === "likert") {
        const dist: Record<string, number> = {};
        for (const a of qAnswers) {
          const n = extractNumberFromAnswerValue(a.value);
          if (n != null) {
            const key = String(n);
            dist[key] = (dist[key] ?? 0) + 1;
          }
        }
        return { ...base, likertDistribution: dist };
      }

      if (q.question_type === "numeric") {
        const nums = qAnswers
          .map((a) => extractNumberFromAnswerValue(a.value))
          .filter((n): n is number => n != null);
        if (nums.length === 0) return base;
        const min = Math.min(...nums);
        const max = Math.max(...nums);
        const mean = nums.reduce((s, n) => s + n, 0) / nums.length;
        return {
          ...base,
          numericSummary: { count: nums.length, min, max, mean },
        };
      }

      return base;
    }
  );

  return {
    completionCount,
    completionRate,
    averageResponseLength,
    questionCompletion,
    engine: "deterministic_v1",
  };
}
