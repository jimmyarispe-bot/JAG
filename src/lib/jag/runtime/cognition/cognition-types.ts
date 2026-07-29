import type { RuntimeEvidenceReference } from "../contracts/evidence";
import type { RuntimeIdentity } from "../contracts/identity";
import type { RuntimeIntent } from "../contracts/intent";
import type { RuntimeOrganizationalContext } from "../contracts/organizational-context";

/** Opaque evidence reference — Law 7. */
export type CognitiveEvidenceRef = RuntimeEvidenceReference;

export type CognitiveRecommendationType =
  | "informational"
  | "actionable"
  | "warning"
  | "opportunity"
  | "unknown";

export interface CognitiveFinding {
  id: string;
  providerId: string;
  title?: string;
  summary?: string;
  confidence: number;
  evidenceRefs: readonly CognitiveEvidenceRef[];
  attributes?: Readonly<Record<string, unknown>>;
}

export interface CognitiveRecommendation {
  id: string;
  type: CognitiveRecommendationType;
  title?: string;
  rationale?: string;
  priority: number;
  confidence: number;
  evidenceRefs: readonly CognitiveEvidenceRef[];
  reasoningNodeIds: readonly string[];
  sourceProviderId: string;
  /** Opaque action candidate for Action Runtime — never executed here. */
  suggestedNextAction?: string;
  topicId?: string;
  conflictFlags: readonly string[];
  /** When true, recommendation lacks evidence and must not drive actions. */
  unsupported?: boolean;
  attributes?: Readonly<Record<string, unknown>>;
}

export interface CognitivePriority {
  id: string;
  title?: string;
  rank: number;
  recommendationId?: string;
  actionCandidateId?: string;
  confidence: number;
}

export interface CognitiveConflict {
  id: string;
  kind: string;
  recommendationIds: readonly string[];
  providerIds: readonly string[];
  summary?: string;
}

export interface ReasoningTraceStep {
  id: string;
  label: string;
  detail?: string;
  at: string;
  attributes?: Readonly<Record<string, unknown>>;
}

/**
 * Normalized cognitive output for Experience (and audit).
 * Never mutates domain state.
 */
export interface CognitiveResult {
  briefId: string;
  summary?: string;
  findings: readonly CognitiveFinding[];
  recommendations: readonly CognitiveRecommendation[];
  priorities: readonly CognitivePriority[];
  unknownGaps: readonly string[];
  conflicts: readonly CognitiveConflict[];
  reasoningTrace: readonly ReasoningTraceStep[];
  consultedProviders: readonly string[];
  failedProviders: readonly { providerId: string; reason: string }[];
  evidenceRefs: readonly CognitiveEvidenceRef[];
  graphSnapshot?: Readonly<Record<string, unknown>>;
  generatedAt: string;
}

export interface CognitiveThinkRequest {
  identity: RuntimeIdentity;
  organizationalContext?: RuntimeOrganizationalContext;
  intent?: RuntimeIntent;
  correlationId?: string;
  sessionId?: string;
  signal?: AbortSignal;
  now?: string;
  /** Soft timeout hint per provider (ms) — best-effort. */
  providerBudgetMs?: number;
}

export type CognitiveThinkOutcome =
  | { status: "ready"; value: CognitiveResult }
  | { status: "partial"; value: CognitiveResult; reason: string }
  | { status: "empty"; value: CognitiveResult; reason: string };

/** Shape consumed by Experience `briefingFromCognition`. */
export function cognitiveResultToBag(
  result: CognitiveResult
): Record<string, unknown> {
  return {
    briefId: result.briefId,
    summary: result.summary,
    unknownGaps: result.unknownGaps,
    priorities: result.priorities.map((p) => ({
      id: p.id,
      title: p.title,
      rank: p.rank,
      actionCandidateId: p.actionCandidateId,
    })),
    recommendations: result.recommendations.map((r) => ({
      id: r.id,
      title: r.title,
      rationale: r.rationale,
      confidence: r.confidence,
      actionCandidateId: r.unsupported ? undefined : r.suggestedNextAction,
      conflictFlags: r.conflictFlags,
      evidenceRefs: r.evidenceRefs,
      sourceProviderId: r.sourceProviderId,
      unsupported: r.unsupported,
    })),
    conflicts: result.conflicts,
    reasoningTrace: result.reasoningTrace,
    consultedProviders: result.consultedProviders,
    failedProviders: result.failedProviders,
    generatedAt: result.generatedAt,
  };
}
