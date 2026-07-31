/**
 * Knowledge Capture — Problem → Cause → Resolution → Verified → Knowledge Base.
 */

import { randomUUID } from "node:crypto";
import {
  getIncident,
  listCapturedKnowledge,
  upsertCapturedKnowledge,
  upsertIncident,
} from "../incident-history/store";
import type { CapturedKnowledgeEntry, HelpIncident } from "../types";

export function captureResolution(input: {
  incidentId: string;
  resolution: string;
  verified?: boolean;
}): CapturedKnowledgeEntry | { error: string } {
  const incident = getIncident(input.incidentId);
  if (!incident) return { error: "Incident not found." };
  if (!incident.diagnosis) return { error: "Incident has no diagnosis." };

  const now = new Date().toISOString();
  const verified = input.verified !== false;
  const entry: CapturedKnowledgeEntry = {
    id: `kb:${randomUUID()}`,
    problem: incident.diagnosis.problem,
    cause: incident.diagnosis.rootCause,
    resolution: input.resolution.trim() || incident.diagnosis.recommendedFix,
    verified,
    intent: incident.diagnosis.intent,
    evidenceIds: Object.freeze(
      incident.diagnosis.evidence.map((e) => e.id)
    ),
    incidentId: incident.id,
    createdAt: now,
  };
  upsertCapturedKnowledge(entry);

  const next: HelpIncident = {
    ...incident,
    status: verified ? "Captured" : "Resolved",
    resolution: entry.resolution,
    verifiedAt: verified ? now : incident.verifiedAt,
    knowledgeEntryId: entry.id,
    updatedAt: now,
  };
  upsertIncident(next);
  return entry;
}

export function listKnowledgeBase(limit = 40): readonly CapturedKnowledgeEntry[] {
  return listCapturedKnowledge(limit);
}
