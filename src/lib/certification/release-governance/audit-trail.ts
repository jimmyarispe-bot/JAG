import type { AuditEvent, AuditEventType } from "@/lib/certification/release-governance/types";

/**
 * Append-only audit trail. Events are never mutated or deleted.
 * In-process store — durable Supabase persistence is a future ops enhancement.
 */
export class AuditTrail {
  private readonly events: AuditEvent[] = [];

  append(input: {
    type: AuditEventType;
    actor: string;
    releaseId: string;
    summary: string;
    payload?: Record<string, unknown>;
    at?: string;
    id?: string;
  }): AuditEvent {
    const event: AuditEvent = {
      id: input.id ?? `aud_${this.events.length + 1}_${Date.now()}`,
      at: input.at ?? new Date().toISOString(),
      type: input.type,
      actor: input.actor,
      releaseId: input.releaseId,
      summary: input.summary,
      payload: input.payload ? Object.freeze({ ...input.payload }) : undefined,
    };
    Object.freeze(event);
    this.events.push(event);
    return event;
  }

  list(releaseId?: string): readonly AuditEvent[] {
    const all = this.events;
    if (!releaseId) return all.slice();
    return all.filter((e) => e.releaseId === releaseId);
  }

  count(releaseId?: string): number {
    return this.list(releaseId).length;
  }
}
