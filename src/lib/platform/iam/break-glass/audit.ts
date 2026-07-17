import type { IamAuditEmitter } from "@/lib/platform/iam/audit/emitter";
import type { InMemoryIamAuditSink } from "@/lib/platform/iam/audit/emitter";
import type { IamAuditEvent } from "@/lib/platform/iam/types";

/**
 * Break-glass audit is append-only. This helper validates immutability
 * against an in-memory sink used in tests and local platforms.
 */
export function assertBreakGlassAuditImmutable(
  sink: InMemoryIamAuditSink,
  eventId: string
): void {
  sink.tryRewrite(eventId);
}

export function listBreakGlassAudit(
  emitter: IamAuditEmitter
): readonly IamAuditEvent[] {
  const sink = emitter.getSink();
  if (!("list" in sink) || typeof (sink as InMemoryIamAuditSink).list !== "function") {
    return [];
  }
  return (sink as InMemoryIamAuditSink)
    .list()
    .filter((e) => e.kind.startsWith("break_glass."));
}
