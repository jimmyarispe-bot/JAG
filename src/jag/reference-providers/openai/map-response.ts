/**
 * Map OpenAI JSON completion → IntelligenceProviderResponse.
 * Grounds all evidence ids to the curated Evidence Graph snapshot.
 * Raw completion is diagnostics only — never Evidence.
 */

import type { Assumption } from "@/jag/intelligence/contracts/assumption";
import type { Confidence, ConfidenceLevel } from "@/jag/intelligence/contracts/confidence";
import type { Explanation } from "@/jag/intelligence/contracts/explanation";
import type { Finding, FindingSeverity } from "@/jag/intelligence/contracts/finding";
import type {
  Recommendation,
  RecommendationPriority,
} from "@/jag/intelligence/contracts/recommendation";
import type { IntelligenceProviderResponse } from "@/jag/intelligence/providers/response";
import { OpenAIProviderError } from "@/jag/reference-providers/openai/errors";

const CONFIDENCE_LEVELS = new Set<ConfidenceLevel>([
  "very_low",
  "low",
  "medium",
  "high",
  "very_high",
]);

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function groundEvidenceIds(
  ids: unknown,
  allowed: ReadonlySet<string>,
  fallbackId: string
): string[] {
  const list = Array.isArray(ids)
    ? ids.filter((id): id is string => typeof id === "string" && allowed.has(id))
    : [];
  if (list.length > 0) return list;
  return [fallbackId];
}

function parseConfidence(value: unknown, fallback: ConfidenceLevel): Confidence {
  const rec = asRecord(value);
  const level =
    rec && typeof rec.level === "string" && CONFIDENCE_LEVELS.has(rec.level as ConfidenceLevel)
      ? (rec.level as ConfidenceLevel)
      : fallback;
  const score =
    rec && typeof rec.score === "number" && rec.score >= 0 && rec.score <= 1
      ? rec.score
      : undefined;
  return score === undefined ? { level } : { level, score };
}

export type MapOpenAIResponseOptions = {
  readonly providerId: string;
  readonly allowedEvidenceIds: readonly string[];
  readonly rawCompletion: string;
  readonly model?: string;
  readonly attempts?: number;
};

/**
 * Parse and coerce model JSON into EI artifacts. Throws if unusable.
 */
export function mapOpenAICompletionToProviderResponse(
  options: MapOpenAIResponseOptions
): IntelligenceProviderResponse {
  const allowed = new Set(options.allowedEvidenceIds);
  if (allowed.size === 0) {
    throw new OpenAIProviderError(
      "invalid_response",
      "Cannot map provider output without curated evidence ids"
    );
  }
  const fallbackEvidenceId = options.allowedEvidenceIds[0]!;

  let parsed: unknown;
  try {
    parsed = JSON.parse(options.rawCompletion);
  } catch (cause) {
    throw new OpenAIProviderError(
      "invalid_response",
      "OpenAI completion was not valid JSON",
      { cause }
    );
  }

  const root = asRecord(parsed);
  if (!root) {
    throw new OpenAIProviderError(
      "invalid_response",
      "OpenAI completion JSON must be an object"
    );
  }

  const findingsRaw = Array.isArray(root.findings) ? root.findings : [];
  const findings: Finding[] = findingsRaw.map((item, index) => {
    const rec = asRecord(item) ?? {};
    const evidenceIds = groundEvidenceIds(
      rec.evidenceIds,
      allowed,
      fallbackEvidenceId
    );
    const severity =
      typeof rec.severity === "string" &&
      ["info", "watch", "concern", "critical"].includes(rec.severity)
        ? (rec.severity as FindingSeverity)
        : undefined;
    return {
      id: typeof rec.id === "string" && rec.id ? rec.id : `finding.${index + 1}`,
      statement:
        typeof rec.statement === "string" && rec.statement
          ? rec.statement
          : "Finding derived from curated organizational evidence",
      evidenceIds: Object.freeze(evidenceIds),
      confidence: parseConfidence(rec.confidence, "medium"),
      ...(severity ? { severity } : {}),
    };
  });

  if (findings.length === 0) {
    findings.push({
      id: "finding.1",
      statement:
        "Insufficient structured findings returned; grounded on curated evidence only",
      evidenceIds: Object.freeze([fallbackEvidenceId]),
      confidence: { level: "low", score: 0.3 },
      severity: "watch",
    });
  }

  const findingIds = new Set(findings.map((f) => f.id));

  const recommendationsRaw = Array.isArray(root.recommendations)
    ? root.recommendations
    : [];
  const recommendations: Recommendation[] = recommendationsRaw.map(
    (item, index) => {
      const rec = asRecord(item) ?? {};
      const evidenceIds = groundEvidenceIds(
        rec.evidenceIds,
        allowed,
        fallbackEvidenceId
      );
      const linkedFindings = Array.isArray(rec.findingIds)
        ? rec.findingIds.filter(
            (id): id is string => typeof id === "string" && findingIds.has(id)
          )
        : [];
      const priority =
        typeof rec.priority === "string" &&
        ["low", "medium", "high", "urgent"].includes(rec.priority)
          ? (rec.priority as RecommendationPriority)
          : undefined;
      return {
        id:
          typeof rec.id === "string" && rec.id
            ? rec.id
            : `recommendation.${index + 1}`,
        action:
          typeof rec.action === "string" && rec.action
            ? rec.action
            : "Review curated organizational evidence",
        rationale:
          typeof rec.rationale === "string" && rec.rationale
            ? rec.rationale
            : "Grounded in Evidence Graph references supplied to the provider",
        findingIds: Object.freeze(
          linkedFindings.length > 0 ? linkedFindings : [findings[0]!.id]
        ),
        evidenceIds: Object.freeze(evidenceIds),
        confidence: parseConfidence(rec.confidence, "medium"),
        ...(priority ? { priority } : {}),
      };
    }
  );

  const explanationRec = asRecord(root.explanation) ?? {};
  const explanationEvidence = groundEvidenceIds(
    explanationRec.evidenceIds,
    allowed,
    fallbackEvidenceId
  );
  const explanationFindings = Array.isArray(explanationRec.findingIds)
    ? explanationRec.findingIds.filter(
        (id): id is string => typeof id === "string" && findingIds.has(id)
      )
    : findings.map((f) => f.id);

  const becauseRaw = Array.isArray(explanationRec.because)
    ? explanationRec.because
    : [];
  const because = becauseRaw
    .map((item) => {
      const rec = asRecord(item);
      if (!rec || typeof rec.claim !== "string") return null;
      return {
        claim: rec.claim,
        evidenceIds: Object.freeze(
          groundEvidenceIds(rec.evidenceIds, allowed, fallbackEvidenceId)
        ),
      };
    })
    .filter((x): x is { claim: string; evidenceIds: readonly string[] } => x !== null);

  const explanation: Explanation = {
    id:
      typeof explanationRec.id === "string" && explanationRec.id
        ? explanationRec.id
        : "explanation.1",
    narrative:
      typeof explanationRec.narrative === "string" && explanationRec.narrative
        ? explanationRec.narrative
        : "Explanation grounded exclusively in curated Evidence Graph artifacts.",
    findingIds: Object.freeze(
      explanationFindings.length > 0
        ? explanationFindings
        : findings.map((f) => f.id)
    ),
    evidenceIds: Object.freeze(explanationEvidence),
    ...(because.length > 0 ? { because: Object.freeze(because) } : {}),
  };

  const assumptionsRaw = Array.isArray(root.assumptions) ? root.assumptions : [];
  const assumptions: Assumption[] = assumptionsRaw
    .map((item, index) => {
      const rec = asRecord(item);
      if (!rec || typeof rec.statement !== "string" || !rec.statement) return null;
      const status =
        typeof rec.status === "string" &&
        ["stated", "inferred", "unverified"].includes(rec.status)
          ? (rec.status as Assumption["status"])
          : "inferred";
      return {
        id:
          typeof rec.id === "string" && rec.id
            ? rec.id
            : `assumption.${index + 1}`,
        statement: rec.statement,
        status,
      } satisfies Assumption;
    })
    .filter((x): x is Assumption => x !== null);

  const overall = parseConfidence(root.confidence, "medium");

  return {
    artifacts: {
      findings: Object.freeze(findings),
      recommendations: Object.freeze(recommendations),
      explanation,
      confidence: overall,
      ...(assumptions.length > 0
        ? { assumptions: Object.freeze(assumptions) }
        : {}),
      decisionTraceSteps: Object.freeze([
        {
          id: "step.reasoning.openai",
          kind: "reasoning" as const,
          summary: "OpenAI reference provider produced structured EI artifacts",
          inputRefs: Object.freeze([...allowed]),
          outputRefs: Object.freeze(findings.map((f) => f.id)),
        },
      ]),
    },
    diagnostics: {
      providerId: options.providerId,
      notes: [
        `model=${options.model ?? "unknown"}`,
        `attempts=${options.attempts ?? 1}`,
        "rawCompletion retained for audit only — not evidence",
      ].join("; "),
      rawCompletion: options.rawCompletion,
    },
  };
}
