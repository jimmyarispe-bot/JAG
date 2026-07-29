import type {
  CognitiveEvidenceRef,
  CognitiveFinding,
  CognitiveRecommendation,
  CognitiveThinkRequest,
} from "./cognition-types";

/**
 * Intelligence provider adapter — engines/packs implement this.
 * Cognitive Runtime never imports concrete engines.
 */
export interface CognitiveProvider {
  id: string;
  /** Opaque capability tags (e.g. "finance", "risk") — not domain logic. */
  capabilities?: readonly string[];
  priority?: number;
  supports?(request: CognitiveThinkRequest): boolean;
  /**
   * Gather evidence references for the current scope.
   * Read-only — no domain mutations.
   */
  gatherEvidence?(
    request: CognitiveThinkRequest
  ):
    | Promise<readonly CognitiveEvidenceRef[]>
    | readonly CognitiveEvidenceRef[];
  /**
   * Produce findings / observations (not recommendations).
   */
  analyze?(
    request: CognitiveThinkRequest,
    evidence: readonly CognitiveEvidenceRef[]
  ): Promise<readonly CognitiveFinding[]> | readonly CognitiveFinding[];
  /**
   * Produce recommendations with evidence references (Law 7).
   */
  recommend?(
    request: CognitiveThinkRequest,
    evidence: readonly CognitiveEvidenceRef[],
    findings: readonly CognitiveFinding[]
  ):
    | Promise<readonly CognitiveRecommendationDraft[]>
    | readonly CognitiveRecommendationDraft[];
}

/** Draft before merge/conflict/priority normalization. */
export interface CognitiveRecommendationDraft {
  id?: string;
  type?: CognitiveRecommendation["type"];
  title?: string;
  rationale?: string;
  priority?: number;
  confidence: number;
  evidenceRefs: readonly CognitiveEvidenceRef[];
  topicId?: string;
  suggestedNextAction?: string;
  attributes?: Readonly<Record<string, unknown>>;
}

export function sortCognitiveProviders(
  providers: readonly CognitiveProvider[]
): CognitiveProvider[] {
  return [...providers].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
}
