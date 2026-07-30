/**
 * ExplanationEngine — compose explanation from subject — Sprint 208.
 */

import { analyzeConfidence } from "./ConfidenceAnalyzer";
import { collectEvidence } from "./EvidenceCollector";
import { exploreDependencies } from "./DependencyExplorer";
import type { ExplanationSubject } from "./ExplainabilityRegistry";
import { buildReasoningChain } from "./ReasoningChain";
import type { Explanation } from "./types";
import { recordExplainObservation } from "./ExplainabilityObservability";

const ADVISORY =
  "Explanation is advisory — traced from bound evidence and services. JAG does not invent facts.";

let seq = 0;
const cache = new Map<string, { at: number; explanation: Explanation }>();
const CACHE_TTL_MS = 60_000;

export function resetExplanationCacheForTests(): void {
  cache.clear();
  seq = 0;
}

export function generateExplanation(
  subject: ExplanationSubject,
  options?: { readonly bypassCache?: boolean }
): Explanation {
  const started = Date.now();
  const cacheKey = `${subject.kind}:${subject.id}`;
  if (!options?.bypassCache) {
    const hit = cache.get(cacheKey);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
      return { ...hit.explanation, cached: true };
    }
  }

  const deps = exploreDependencies(subject);
  const collected = collectEvidence(subject);
  const assumptions = subject.assumptions ?? [];
  const confidence = analyzeConfidence({
    baseConfidence: subject.confidence,
    evidence: collected.evidence,
    assumptionCount: assumptions.length,
    missingInformation: collected.missing,
    timelineDates: collected.timeline.map((t) => t.at),
  });

  const reasoningChain = buildReasoningChain(subject, deps.relatedNodeIds);

  const explanation: Explanation = {
    id: `expl-${++seq}-${Date.now()}`,
    subjectId: subject.id,
    subjectKind: subject.kind,
    title: `Why: ${subject.title}`,
    summary: subject.summary,
    organizationId: subject.organizationId,
    reasoningChain,
    evidence: collected.evidence,
    policies: subject.policies ?? [],
    forecasts: subject.forecasts ?? [],
    scenarios: subject.scenarios ?? [],
    memory: subject.memory ?? [],
    goals: subject.goals ?? [],
    decisions: subject.decisions ?? [],
    outcomes: subject.outcomes ?? [],
    contributors: subject.contributors ?? [],
    assumptions,
    confidence,
    timeline: collected.timeline,
    relatedNodeIds: deps.relatedNodeIds,
    generatedAt: new Date().toISOString(),
    advisoryNotice: ADVISORY,
    cached: false,
  };

  cache.set(cacheKey, { at: Date.now(), explanation });
  if (cache.size > 200) {
    const first = cache.keys().next().value;
    if (first) cache.delete(first);
  }

  recordExplainObservation({
    kind: "explanation_generation",
    organizationId: subject.organizationId,
    durationMs: Date.now() - started,
    detail: `Generated explanation for ${subject.kind} ${subject.id} (confidence ${confidence.band}).`,
    subjectId: subject.id,
    metadata: { kind: subject.kind, cached: "false" },
  });

  return explanation;
}
