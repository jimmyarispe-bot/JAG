import type {
  DocumentInstance,
  DocumentInstanceId,
  DocumentVersion,
  DocumentVersionId,
} from "@/jag/documents/contracts/definitions";

const instances = new Map<DocumentInstanceId, DocumentInstance>();
/** Insertion-ordered version log per instance. */
const versions = new Map<DocumentInstanceId, DocumentVersion[]>();
const versionIndex = new Map<DocumentVersionId, DocumentVersion>();
const accessCounts = new Map<DocumentInstanceId, number>();

export function putDocumentInstance(instance: DocumentInstance): void {
  instances.set(instance.id, instance);
}

export function getDocumentInstance(
  instanceId: DocumentInstanceId
): DocumentInstance | null {
  return instances.get(instanceId) ?? null;
}

export function listDocumentInstances(filter?: {
  organizationId?: string;
  definitionId?: string;
  status?: DocumentInstance["status"];
}): DocumentInstance[] {
  let all = [...instances.values()];
  if (filter?.organizationId) {
    all = all.filter((i) => i.organizationId === filter.organizationId);
  }
  if (filter?.definitionId) {
    all = all.filter((i) => i.definitionId === filter.definitionId);
  }
  if (filter?.status) {
    all = all.filter((i) => i.status === filter.status);
  }
  return all.sort((a, b) => a.id.localeCompare(b.id));
}

export function appendDocumentVersion(version: DocumentVersion): void {
  const list = versions.get(version.instanceId) ?? [];
  list.push(version);
  versions.set(version.instanceId, list);
  versionIndex.set(version.id, version);
}

export function listDocumentVersions(
  instanceId: DocumentInstanceId
): readonly DocumentVersion[] {
  return versions.get(instanceId) ?? [];
}

export function getDocumentVersion(
  versionId: DocumentVersionId
): DocumentVersion | null {
  return versionIndex.get(versionId) ?? null;
}

export function incrementDocumentAccess(instanceId: DocumentInstanceId): number {
  const next = (accessCounts.get(instanceId) ?? 0) + 1;
  accessCounts.set(instanceId, next);
  return next;
}

export function getDocumentAccessCount(instanceId: DocumentInstanceId): number {
  return accessCounts.get(instanceId) ?? 0;
}

export function resetDocumentInstanceStoreForTests(): void {
  instances.clear();
  versions.clear();
  versionIndex.clear();
  accessCounts.clear();
}
