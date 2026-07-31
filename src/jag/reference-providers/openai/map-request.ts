/**
 * Map IntelligenceProviderRequest → OpenAI chat completion params.
 */

import type { IntelligenceProviderRequest } from "@/jag/intelligence/providers/request";
import type { OpenAIChatCompletionParams } from "@/jag/reference-providers/openai/client";

const SYSTEM_PROMPT = [
  "You are an Executive Intelligence reasoning helper for JAG OS.",
  "You receive a curated evidence graph snapshot — do not invent organizational artifacts.",
  "Respond with a single JSON object matching this shape:",
  "{",
  '  "findings": [{ "id", "statement", "evidenceIds", "confidence": { "level", "score?" }, "severity?" }],',
  '  "recommendations": [{ "id", "action", "rationale", "findingIds", "evidenceIds", "confidence", "priority?" }],',
  '  "explanation": { "id", "narrative", "findingIds", "evidenceIds", "because": [{ "claim", "evidenceIds" }] },',
  '  "assumptions": [{ "id", "statement", "status" }],',
  '  "confidence": { "level", "score?" }',
  "}",
  "Rules:",
  "- evidenceIds MUST be chosen only from the provided evidence id list.",
  "- Never treat model prose as evidence.",
  "- Prefer explainable because-clauses tied to evidence ids.",
  "- confidence.level must be one of: very_low, low, medium, high, very_high.",
].join("\n");

export type MappedOpenAIRequest = {
  readonly completion: OpenAIChatCompletionParams;
  readonly allowedEvidenceIds: readonly string[];
};

export function mapProviderRequestToOpenAI(
  request: IntelligenceProviderRequest,
  model: string
): MappedOpenAIRequest {
  const allowedEvidenceIds = Object.freeze(
    request.evidence.map((e) => e.id).filter(Boolean)
  );

  const evidencePayload = request.evidence.map((item) => ({
    id: item.id,
    summary: item.summary,
    references: item.references.map((r) => ({
      kind: r.kind,
      refId: r.refId,
      label: r.label,
    })),
  }));

  const userContent = JSON.stringify(
    {
      question: {
        id: request.question.id,
        text: request.question.text,
        intentHint: request.question.intentHint,
      },
      context: {
        organizationId: request.context.organizationId,
        industryId: request.context.industryId,
        enabledCapabilityPackIds: request.context.enabledCapabilityPackIds,
      },
      plan: {
        questionId: request.plan.questionId,
        organizationId: request.plan.organizationId,
        stages: request.plan.stages.map((s) => ({
          id: s.id,
          label: s.label,
        })),
      },
      evidence: evidencePayload,
      allowedEvidenceIds,
      correlationId: request.correlationId,
    },
    null,
    2
  );

  return {
    allowedEvidenceIds,
    completion: {
      model,
      temperature: 0,
      jsonObjectMode: true,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
    },
  };
}
