/**
 * Enterprise Governance — history.
 */

import type {
  GovernanceAuditEvent,
  GovernanceHistoryEntry,
} from "@/lib/platform/governance/types";

export interface GovernanceHistoryDependencies {
  createId?: (prefix: string) => string;
}

export class GovernanceHistory {
  private readonly createId: (prefix: string) => string;
  private readonly entries: GovernanceHistoryEntry[] = [];

  constructor(dependencies: GovernanceHistoryDependencies = {}) {
    let n = 0;
    this.createId =
      dependencies.createId ?? ((prefix) => `${prefix}-${++n}`);
  }

  append(input: {
    occurredAt: string;
    kind: string;
    title: string;
    detail: string;
    actor: string;
  }): GovernanceHistoryEntry {
    const entry: GovernanceHistoryEntry = {
      entryId: this.createId("hist"),
      occurredAt: input.occurredAt,
      kind: input.kind,
      title: input.title,
      detail: input.detail,
      actor: input.actor,
    };
    this.entries.push(entry);
    return entry;
  }

  fromAudit(events: readonly GovernanceAuditEvent[]): GovernanceHistoryEntry[] {
    return events.map((event) =>
      this.append({
        occurredAt: event.occurredAt,
        kind: event.kind,
        title: event.title,
        detail: event.detail,
        actor: event.actor,
      })
    );
  }

  list(): readonly GovernanceHistoryEntry[] {
    return [...this.entries].sort((a, b) =>
      a.occurredAt.localeCompare(b.occurredAt)
    );
  }
}
