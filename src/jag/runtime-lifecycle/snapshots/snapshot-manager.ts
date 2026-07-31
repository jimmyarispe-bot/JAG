/**
 * Snapshot Manager — in-memory contracts only (no persistence).
 */

import type { RuntimeSpecification } from "@/jag/blueprints/contracts";
import { diffRuntimeSpecifications } from "@/jag/runtime-generation";
import type {
  RuntimeSnapshot,
  RuntimeVersion,
  SnapshotCompareResult,
} from "@/jag/runtime-lifecycle/contracts";
import { checksumRuntimeSpecification } from "@/jag/runtime-lifecycle/versioning";

let snapshotSeq = 0;

export function resetSnapshotSequenceForTests(): void {
  snapshotSeq = 0;
}

export function createSnapshot(
  version: RuntimeVersion,
  options: { readonly label?: string; readonly createdAt?: string; readonly snapshotId?: string } = {}
): RuntimeSnapshot {
  snapshotSeq += 1;
  const specification = Object.freeze(
    JSON.parse(JSON.stringify(version.specification))
  ) as RuntimeSpecification;

  return Object.freeze({
    snapshotId:
      options.snapshotId ??
      `${version.versionId}.snapshot.${snapshotSeq}`,
    versionId: version.versionId,
    createdAt: options.createdAt ?? new Date().toISOString(),
    checksum: checksumRuntimeSpecification(specification),
    label: options.label,
    specification,
  });
}

export function compareSnapshots(
  left: RuntimeSnapshot,
  right: RuntimeSnapshot
): SnapshotCompareResult {
  const diff = diffRuntimeSpecifications(
    left.specification,
    right.specification
  );
  const identical =
    left.checksum === right.checksum &&
    diff.added.length === 0 &&
    diff.removed.length === 0 &&
    diff.modified.length === 0;

  return Object.freeze({
    leftSnapshotId: left.snapshotId,
    rightSnapshotId: right.snapshotId,
    identical,
    diff,
  });
}

/** Restore candidate — metadata pointing at a snapshot to restore (no execution). */
export function restoreCandidate(snapshot: RuntimeSnapshot): {
  readonly candidateSnapshotId: string;
  readonly versionId: string;
  readonly checksum: string;
  readonly specification: RuntimeSpecification;
} {
  return Object.freeze({
    candidateSnapshotId: snapshot.snapshotId,
    versionId: snapshot.versionId,
    checksum: snapshot.checksum,
    specification: snapshot.specification,
  });
}
