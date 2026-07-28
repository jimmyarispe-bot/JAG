import { randomUUID } from "node:crypto";
import { appendAudit, appendTimeline } from "./store";
import type { AdmissionsAuditEntry, AdmissionsTimelineEntry } from "./types";

export function recordAdmissionsAudit(input: {
  organizationId: string;
  applicantId: string;
  action: string;
  actor: string;
  details?: Record<string, string>;
}): AdmissionsAuditEntry {
  return appendAudit({
    id: randomUUID(),
    organizationId: input.organizationId,
    applicantId: input.applicantId,
    action: input.action,
    actor: input.actor,
    at: new Date().toISOString(),
    details: Object.freeze(input.details ?? {}),
  });
}

export function recordAdmissionsTimeline(input: {
  organizationId: string;
  applicantId: string;
  kind: string;
  message: string;
  actor: string;
  metadata?: Record<string, string>;
}): AdmissionsTimelineEntry {
  return appendTimeline({
    id: randomUUID(),
    organizationId: input.organizationId,
    applicantId: input.applicantId,
    kind: input.kind,
    message: input.message,
    actor: input.actor,
    at: new Date().toISOString(),
    metadata: Object.freeze(input.metadata ?? {}),
  });
}
