/**
 * Evidence-backed signal extraction (deterministic).
 * No signal without evidence. No fabricated findings.
 */

import { classifyTextValence, DeterministicThemeGrouper } from "./grouping";
import {
  extractNumberFromAnswerValue,
  extractOptionKey,
  extractOptionKeys,
  extractTextFromAnswerValue,
  normalizeListeningText,
} from "./normalize";
import type {
  ListeningAnswerRow,
  ListeningQuestionRow,
} from "./metrics";
import type {
  ListeningCampaignMetrics,
  ListeningExtractedSignal,
  ListeningNormalizedText,
  ListeningSignalClass,
  ListeningThemeGrouper,
} from "./types";

function clampConfidence(n: number): number {
  return Math.max(0, Math.min(1, Number(n.toFixed(4))));
}

function evidenceFromUnit(
  unit: ListeningNormalizedText,
  label: string
): ListeningExtractedSignal["evidence"][number] {
  return {
    evidenceKind: "answer",
    answerId: unit.answerId,
    questionId: unit.questionId,
    responseId: unit.responseId,
    label,
    payload: {
      excerpt: unit.rawText.slice(0, 280),
      question_prompt: unit.questionPrompt,
    },
  };
}

export function buildNormalizedTextUnits(input: {
  readonly answers: readonly ListeningAnswerRow[];
  readonly questions: readonly ListeningQuestionRow[];
}): ListeningNormalizedText[] {
  const prompts = new Map(
    input.questions.map((q) => [q.id, q.prompt] as const)
  );
  const units: ListeningNormalizedText[] = [];
  for (const a of input.answers) {
    if (a.question_type !== "short_text" && a.question_type !== "long_text") {
      continue;
    }
    const text = extractTextFromAnswerValue(a.value);
    if (!text || !text.trim()) continue;
    const { normalized, tokens } = normalizeListeningText(text);
    units.push({
      answerId: a.id,
      responseId: a.response_id,
      questionId: a.question_id,
      questionPrompt: prompts.get(a.question_id) ?? "",
      rawText: text.trim(),
      normalized,
      tokens,
    });
  }
  return units;
}

export function extractListeningSignals(input: {
  readonly answers: readonly ListeningAnswerRow[];
  readonly questions: readonly ListeningQuestionRow[];
  readonly metrics: ListeningCampaignMetrics;
  readonly grouper?: ListeningThemeGrouper;
  /** Minimum support for theme groups (default 2, or 1 when only one response). */
  readonly minThemeSupport?: number;
}): ListeningExtractedSignal[] {
  const grouper = input.grouper ?? new DeterministicThemeGrouper();
  const units = buildNormalizedTextUnits(input);
  const minSupport =
    input.minThemeSupport ??
    (input.metrics.completionCount <= 1 ? 1 : 2);

  const signals: ListeningExtractedSignal[] = [];
  const groups = grouper.group(units);

  for (const group of groups) {
    if (group.members.length < minSupport) continue;
    const joined = group.members.map((m) => m.rawText).join(" ");
    const valence = classifyTextValence(joined) as ListeningSignalClass;
    const signalClass: ListeningSignalClass =
      valence === "theme" ? "theme" : valence;
    const questionId = group.members[0]?.questionId ?? null;
    const confidence = clampConfidence(
      0.35 + Math.min(0.5, group.members.length * 0.1)
    );
    signals.push({
      signalClass,
      title: truncateTitle(group.label),
      description: `Observed in ${group.members.length} free-text response(s). Classified as ${signalClass} via deterministic keyword/theme grouping (${grouper.id}).`,
      confidence,
      supportCount: group.members.length,
      questionId,
      evidence: group.members.map((m) =>
        evidenceFromUnit(m, `Free-text answer supporting “${truncateTitle(group.label)}”`)
      ),
    });
  }

  // Structured distributions — only when evidence exists (answers).
  for (const q of input.questions) {
    const qAnswers = input.answers.filter((a) => a.question_id === q.id);
    if (qAnswers.length === 0) continue;

    if (
      q.question_type === "single_choice" ||
      q.question_type === "multi_choice"
    ) {
      const dist: Record<string, { count: number; answerIds: string[] }> = {};
      for (const a of qAnswers) {
        const keys =
          q.question_type === "single_choice"
            ? [extractOptionKey(a.value)].filter(Boolean)
            : extractOptionKeys(a.value);
        for (const key of keys as string[]) {
          const bucket = dist[key] ?? { count: 0, answerIds: [] };
          bucket.count += 1;
          bucket.answerIds.push(a.id);
          dist[key] = bucket;
        }
      }
      const total = qAnswers.length;
      for (const [optionKey, bucket] of Object.entries(dist)) {
        if (bucket.count < minSupport) continue;
        const share = bucket.count / total;
        if (share < 0.5) continue;
        const label =
          q.options?.find((o) => o.option_key === optionKey)?.label ??
          optionKey;
        const valence = classifyTextValence(`${q.prompt} ${label}`);
        signals.push({
          signalClass: valence === "theme" ? "theme" : valence,
          title: truncateTitle(`${label} (${Math.round(share * 100)}%)`),
          description: `Choice “${label}” selected in ${bucket.count}/${total} answers for “${q.prompt}”.`,
          confidence: clampConfidence(0.4 + share * 0.4),
          supportCount: bucket.count,
          questionId: q.id,
          evidence: bucket.answerIds.map((answerId) => {
            const row = qAnswers.find((a) => a.id === answerId)!;
            return {
              evidenceKind: "answer" as const,
              answerId,
              questionId: q.id,
              responseId: row.response_id,
              label: `Selected “${label}”`,
              payload: {
                option_key: optionKey,
                question_prompt: q.prompt,
              },
            };
          }),
        });
      }
    }

    if (q.question_type === "likert" || q.question_type === "numeric") {
      const nums = qAnswers
        .map((a) => ({
          a,
          n: extractNumberFromAnswerValue(a.value),
        }))
        .filter((x): x is { a: ListeningAnswerRow; n: number } => x.n != null);
      if (nums.length < minSupport) continue;
      const mean =
        nums.reduce((s, x) => s + x.n, 0) / Math.max(1, nums.length);
      const metric = input.metrics.questionCompletion.find(
        (m) => m.questionId === q.id
      );
      const scaleMax =
        q.question_type === "likert"
          ? Math.max(
              5,
              ...Object.keys(metric?.likertDistribution ?? {}).map(Number)
            )
          : metric?.numericSummary?.max ?? mean;

      let signalClass: ListeningSignalClass = "theme";
      if (scaleMax > 0 && mean <= scaleMax * 0.35) signalClass = "concern";
      else if (scaleMax > 0 && mean >= scaleMax * 0.7) signalClass = "strength";
      else continue;

      signals.push({
        signalClass,
        title: truncateTitle(
          `${signalClass === "concern" ? "Lower" : "Higher"} scores — ${q.prompt}`
        ),
        description: `Mean score ${mean.toFixed(2)} across ${nums.length} numeric/likert answers.`,
        confidence: clampConfidence(0.45 + Math.min(0.35, nums.length * 0.05)),
        supportCount: nums.length,
        questionId: q.id,
        evidence: nums.map(({ a, n }) => ({
          evidenceKind: "answer" as const,
          answerId: a.id,
          questionId: q.id,
          responseId: a.response_id,
          label: `Score ${n}`,
          payload: { number: n, question_prompt: q.prompt },
        })),
      });
    }
  }

  // Drop any accidental empty-evidence signals (invariant).
  return signals.filter((s) => s.evidence.length > 0);
}

function truncateTitle(text: string): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > 100 ? `${t.slice(0, 97)}…` : t;
}
