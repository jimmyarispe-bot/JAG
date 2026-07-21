import {
  domainForEvent,
  severityRank,
  type EiEventSignal,
} from "@/lib/founder-intelligence/events";
import type { NormalizedEvent } from "../types";

/** Stage 2 — Normalization */
export function stageNormalization(signals: EiEventSignal[]): NormalizedEvent[] {
  return signals.map((s) => ({
    id: s.id,
    eventType: s.eventType,
    moduleKey: s.moduleKey,
    domain: domainForEvent(s.eventType, s.moduleKey),
    title: s.title,
    summary: s.summary,
    occurredAt: s.occurredAt,
    entityType: s.entityType,
    entityId: s.entityId,
    classification: s.classification,
    severityRank: severityRank(s.eventType, s.classification),
    payload: s.payload,
  }));
}
