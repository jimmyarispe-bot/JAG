/**
 * Enterprise Governance — evidence.
 */

import type {
  GovernanceCycleRequest,
  GovernanceEvidenceRecord,
} from "@/lib/platform/governance/types";

export interface GovernanceEvidenceDependencies {
  now?: () => Date;
  createId?: (prefix: string) => string;
}

export class GovernanceEvidence {
  private readonly now: () => Date;
  private readonly createId: (prefix: string) => string;
  private readonly store = new Map<string, GovernanceEvidenceRecord>();

  constructor(dependencies: GovernanceEvidenceDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date());
    let n = 0;
    this.createId =
      dependencies.createId ?? ((prefix) => `${prefix}-${++n}`);
  }

  syncFromCycle(request: GovernanceCycleRequest): GovernanceEvidenceRecord[] {
    const records: GovernanceEvidenceRecord[] = [];

    for (const item of request.decision?.evidence.items ?? []) {
      records.push(
        this.capture({
          evidenceId: item.evidenceId,
          title: item.title,
          summary: item.summary,
          sourceRef: item.sourceRef ?? null,
          weight: item.weight,
          linkedItemIds: [request.decision?.requestId ?? request.requestId],
        })
      );
    }

    for (const id of request.workspaceLinks?.evidenceIds ?? []) {
      if (!this.store.has(id)) {
        records.push(
          this.capture({
            evidenceId: id,
            title: `Workspace evidence ${id}`,
            summary: "Linked from Executive Workspace",
            sourceRef: "executive-workspace",
            weight: 0.5,
            linkedItemIds: [request.requestId],
          })
        );
      }
    }

    for (const memory of request.memories ?? []) {
      records.push(
        this.capture({
          title: `Memory ${memory.id}`,
          summary: memory.observations.slice(0, 2).join(" · ") || memory.domain,
          sourceRef: memory.id,
          weight: memory.confidence.value,
          linkedItemIds: [memory.id],
        })
      );
    }

    return records;
  }

  capture(input: {
    evidenceId?: string;
    title: string;
    summary: string;
    sourceRef?: string | null;
    weight?: number;
    linkedItemIds?: readonly string[];
  }): GovernanceEvidenceRecord {
    const record: GovernanceEvidenceRecord = {
      evidenceId: input.evidenceId ?? this.createId("gev"),
      title: input.title,
      summary: input.summary,
      sourceRef: input.sourceRef ?? null,
      weight: input.weight ?? 0.5,
      linkedItemIds: [...(input.linkedItemIds ?? [])],
      capturedAt: this.now().toISOString(),
    };
    this.store.set(record.evidenceId, record);
    return record;
  }

  list(): readonly GovernanceEvidenceRecord[] {
    return Array.from(this.store.values());
  }
}
