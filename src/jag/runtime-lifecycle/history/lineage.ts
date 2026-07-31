/**
 * Runtime history / lineage — Organization → Blueprint → Runtime → Version → Promotion.
 */

import type {
  RuntimeHistoryEntry,
  RuntimeLineage,
  RuntimePromotionEvent,
  RuntimeRollbackRecord,
  RuntimeSnapshot,
  RuntimeVersion,
} from "@/jag/runtime-lifecycle/contracts";

let historySeq = 0;

export function resetHistorySequenceForTests(): void {
  historySeq = 0;
}

export function appendHistory(
  history: RuntimeHistoryEntry[],
  entry: Omit<RuntimeHistoryEntry, "entryId"> & { readonly entryId?: string }
): RuntimeHistoryEntry {
  historySeq += 1;
  const frozen: RuntimeHistoryEntry = Object.freeze({
    entryId: entry.entryId ?? `history.${historySeq}`,
    at: entry.at,
    kind: entry.kind,
    organizationId: entry.organizationId,
    versionId: entry.versionId,
    snapshotId: entry.snapshotId,
    rollbackId: entry.rollbackId,
    detail: entry.detail,
    payload: entry.payload ? Object.freeze({ ...entry.payload }) : undefined,
  });
  history.push(frozen);
  return frozen;
}

export function buildLineage(input: {
  readonly organizationId: string;
  readonly industryId: RuntimeLineage["industryId"];
  readonly versions: readonly RuntimeVersion[];
  readonly promotions: readonly RuntimePromotionEvent[];
  readonly snapshots: readonly RuntimeSnapshot[];
  readonly rollbacks: readonly RuntimeRollbackRecord[];
  readonly history: readonly RuntimeHistoryEntry[];
}): RuntimeLineage {
  const published = [...input.versions]
    .filter((v) => v.state === "published")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .at(-1);

  return Object.freeze({
    organizationId: input.organizationId,
    industryId: input.industryId,
    versions: Object.freeze([...input.versions]),
    promotions: Object.freeze([...input.promotions]),
    snapshots: Object.freeze([...input.snapshots]),
    rollbacks: Object.freeze([...input.rollbacks]),
    history: Object.freeze([...input.history]),
    publishedVersionId: published?.versionId,
  });
}
