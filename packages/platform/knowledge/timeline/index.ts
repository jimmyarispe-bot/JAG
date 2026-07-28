import { newId } from "../ids";
import { kstore } from "../store";
import type { TimelineEntry } from "../types";

export function appendTimeline(input: {
  organizationId: string;
  kind: string;
  title: string;
  documentId?: string | null;
  evidenceFactId?: string | null;
  subjectRef?: string | null;
  occurredAt?: string;
}): TimelineEntry {
  return kstore.upsertTimeline({
    id: newId("ktl"),
    organizationId: input.organizationId,
    occurredAt: input.occurredAt ?? new Date().toISOString(),
    kind: input.kind,
    title: input.title,
    documentId: input.documentId ?? null,
    evidenceFactId: input.evidenceFactId ?? null,
    subjectRef: input.subjectRef ?? null,
  });
}

export function buildTimeline(input: {
  organizationId: string;
  subjectRef?: string | null;
  documentId?: string | null;
}): readonly TimelineEntry[] {
  return Object.freeze(
    kstore
      .listTimeline(input.organizationId)
      .filter(
        (t) =>
          (input.subjectRef ? t.subjectRef === input.subjectRef : true) &&
          (input.documentId ? t.documentId === input.documentId : true)
      )
  );
}
