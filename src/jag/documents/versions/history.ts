/**
 * Version history helpers — immutable append-only semantics.
 */

import type {
  DocumentVersion,
  DocumentVersionId,
} from "@/jag/documents/contracts/definitions";
import {
  getDocumentVersion,
  listDocumentVersions,
} from "@/jag/documents/runtime/instance-store";

export function getCurrentVersion(
  versions: readonly DocumentVersion[],
  currentVersionId: DocumentVersionId
): DocumentVersion | null {
  return versions.find((v) => v.id === currentVersionId) ?? null;
}

export function orderVersionsAscending(
  versions: readonly DocumentVersion[]
): DocumentVersion[] {
  return [...versions].sort(
    (a, b) =>
      a.versionNumber - b.versionNumber || a.id.localeCompare(b.id)
  );
}

export function assertVersionImmutable(version: DocumentVersion): void {
  if (version.immutable !== true) {
    throw new Error(`Document version "${version.id}" must be immutable`);
  }
}

export function resolveHistoricalVersions(
  instanceId: string,
  currentVersionId: DocumentVersionId
): {
  current: DocumentVersion | null;
  historical: DocumentVersion[];
} {
  const ordered = orderVersionsAscending(listDocumentVersions(instanceId));
  const current =
    getDocumentVersion(currentVersionId) ??
    getCurrentVersion(ordered, currentVersionId);
  return {
    current,
    historical: ordered.filter((v) => v.id !== currentVersionId),
  };
}
