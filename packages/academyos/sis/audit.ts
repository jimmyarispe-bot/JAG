import { randomUUID } from "node:crypto";
import { appendStudentAudit, appendStudentTimeline } from "./store";

export function recordStudentAudit(input: {
  organizationId: string;
  studentId: string;
  action: string;
  actor: string;
  details?: Record<string, string>;
}) {
  return appendStudentAudit({
    id: randomUUID(),
    organizationId: input.organizationId,
    studentId: input.studentId,
    action: input.action,
    actor: input.actor,
    at: new Date().toISOString(),
    details: Object.freeze(input.details ?? {}),
  });
}

export function recordStudentTimeline(input: {
  organizationId: string;
  studentId: string;
  kind: string;
  message: string;
  actor: string;
  metadata?: Record<string, string>;
}) {
  return appendStudentTimeline({
    id: randomUUID(),
    organizationId: input.organizationId,
    studentId: input.studentId,
    kind: input.kind,
    message: input.message,
    actor: input.actor,
    at: new Date().toISOString(),
    metadata: Object.freeze(input.metadata ?? {}),
  });
}
