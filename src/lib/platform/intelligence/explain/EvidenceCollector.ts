/**
 * EvidenceCollector — Sprint 208.
 */

import type { ExplainEvidenceRef, ExplainTimelineEntry } from "./types";
import type { ExplanationSubject } from "./ExplainabilityRegistry";
import { recordExplainObservation } from "./ExplainabilityObservability";

export function collectEvidence(
  subject: ExplanationSubject
): {
  readonly evidence: readonly ExplainEvidenceRef[];
  readonly timeline: readonly ExplainTimelineEntry[];
  readonly missing: readonly string[];
} {
  const started = Date.now();
  const evidence: ExplainEvidenceRef[] = (subject.evidence ?? []).map((e) => ({
    id: e.id,
    source: e.source,
    summary: e.summary,
    freshness: subject.createdAt,
    strength: 0.6,
  }));

  if (evidence.length === 0 && subject.summary) {
    evidence.push({
      id: `ev-${subject.id}-summary`,
      source: subject.kind,
      summary: subject.summary,
      freshness: subject.createdAt,
      strength: 0.4,
    });
  }

  for (const driver of subject.drivers ?? []) {
    evidence.push({
      id: `ev-driver-${driver.slice(0, 24)}`,
      source: "Primary driver",
      summary: driver,
      strength: 0.55,
    });
  }

  const timeline: ExplainTimelineEntry[] = [
    ...(subject.timeline ?? []).map((t) => ({
      at: t.at,
      message: t.message,
      kind: "event",
    })),
  ];

  if (subject.createdAt) {
    timeline.unshift({
      at: subject.createdAt.slice(0, 10),
      message: `${subject.kind} created: ${subject.title}`,
      kind: "created",
    });
  }

  timeline.sort((a, b) => a.at.localeCompare(b.at));

  const missing: string[] = [];
  if (!subject.evidence?.length) missing.push("Structured evidence refs");
  if (!subject.policies?.length) missing.push("Policy references");
  if (subject.confidence == null) missing.push("Explicit confidence score");

  recordExplainObservation({
    kind: "evidence_lookup",
    organizationId: subject.organizationId,
    durationMs: Date.now() - started,
    detail: `Collected ${evidence.length} evidence item(s) for ${subject.id}`,
    subjectId: subject.id,
  });

  return {
    evidence: evidence.slice(0, 12),
    timeline: timeline.slice(0, 20),
    missing,
  };
}
