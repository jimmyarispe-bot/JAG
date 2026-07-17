/**
 * Pluggable IAM audit emitter (DI).
 * Authorization and temporary-authority services emit through this port.
 */

import type { IamAuditEvent, IamAuditEventKind } from "@/lib/platform/iam/types";

export type IamAuditSink = {
  append(event: IamAuditEvent): void | Promise<void>;
};

export type IamAuditEmitterDependencies = {
  now?: () => Date;
  createId?: (prefix: string) => string;
  sink?: IamAuditSink;
};

export class InMemoryIamAuditSink implements IamAuditSink {
  readonly events: IamAuditEvent[] = [];

  append(event: IamAuditEvent): void {
    if (event.immutable) {
      // Append-only: never mutate prior immutable rows.
      this.events.push(Object.freeze({ ...event, detail: { ...event.detail } }));
      return;
    }
    this.events.push(event);
  }

  list(): readonly IamAuditEvent[] {
    return this.events;
  }

  /** Attempts to mutate an immutable event must fail. */
  tryRewrite(id: string): never | void {
    const idx = this.events.findIndex((e) => e.id === id);
    if (idx < 0) return;
    if (this.events[idx]?.immutable) {
      throw new Error(`Immutable audit event cannot be rewritten: ${id}`);
    }
  }
}

export class IamAuditEmitter {
  private readonly now: () => Date;
  private readonly createId: (prefix: string) => string;
  private readonly sink: IamAuditSink;

  constructor(dependencies: IamAuditEmitterDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date());
    let n = 0;
    this.createId =
      dependencies.createId ?? ((prefix) => `${prefix}-${++n}`);
    this.sink = dependencies.sink ?? new InMemoryIamAuditSink();
  }

  getSink(): IamAuditSink {
    return this.sink;
  }

  emit(input: {
    kind: IamAuditEventKind;
    actorUserId?: string | null;
    subjectUserId?: string | null;
    organizationId?: string | null;
    permission?: string | null;
    detail?: Readonly<Record<string, unknown>>;
    immutable?: boolean;
  }): IamAuditEvent {
    const event: IamAuditEvent = {
      id: this.createId("iam-audit"),
      kind: input.kind,
      actorUserId: input.actorUserId ?? null,
      subjectUserId: input.subjectUserId ?? null,
      organizationId: input.organizationId ?? null,
      permission: input.permission ?? null,
      detail: input.detail ?? {},
      at: this.now().toISOString(),
      immutable: input.immutable ?? isImmutableKind(input.kind),
    };
    void this.sink.append(event);
    return event;
  }
}

function isImmutableKind(kind: IamAuditEventKind): boolean {
  return kind.startsWith("break_glass.");
}
