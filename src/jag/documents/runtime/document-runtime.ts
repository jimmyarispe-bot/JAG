/**
 * DocumentRuntime — lifecycle orchestration without persistence drivers.
 */

import { assertAllowedClassification } from "@/jag/documents/classification";
import type {
  DocumentClassification,
  DocumentInstance,
  DocumentInstanceId,
  DocumentMetadata,
  DocumentMetrics,
  DocumentReference,
  DocumentResult,
  DocumentVersion,
} from "@/jag/documents/contracts/definitions";
import { getDocumentExtensions } from "@/jag/documents/contracts/extensions";
import { emitDocumentEvent } from "@/jag/documents/events";
import { checkDocumentPermission } from "@/jag/documents/permissions";
import { assertDocumentRegistered } from "@/jag/documents/registry";
import { documentNow } from "@/jag/documents/runtime/clock";
import { nextDocumentOpaqueId } from "@/jag/documents/runtime/ids";
import {
  appendDocumentVersion,
  getDocumentAccessCount,
  getDocumentInstance,
  getDocumentVersion,
  incrementDocumentAccess,
  listDocumentVersions,
  putDocumentInstance,
} from "@/jag/documents/runtime/instance-store";
import { assertVersionImmutable, orderVersionsAscending } from "@/jag/documents/versions";
import { trackDocumentTelemetry } from "@/jag/documents/telemetry";
import { getDocumentTemplate } from "@/jag/documents/registry";

function fail<T = never>(code: string, message: string): DocumentResult<T> {
  return { ok: false, error: { code, message } };
}

function iso(d: Date = documentNow()): string {
  return d.toISOString();
}

function mutateInstance(
  instance: DocumentInstance,
  patch: Partial<DocumentInstance>
): DocumentInstance {
  const next: DocumentInstance = Object.freeze({
    ...instance,
    ...patch,
    metadata: Object.freeze({
      ...(patch.metadata ?? instance.metadata),
      tags: [...(patch.metadata?.tags ?? instance.metadata.tags ?? [])],
      attributes: {
        ...(instance.metadata.attributes ?? {}),
        ...(patch.metadata?.attributes ?? {}),
      },
    }),
    links: Object.freeze(
      [...(patch.links ?? instance.links)].map((l) => Object.freeze({ ...l }))
    ),
  });
  putDocumentInstance(next);
  return next;
}

function freezeVersion(version: DocumentVersion): DocumentVersion {
  const frozen: DocumentVersion = Object.freeze({
    ...version,
    immutable: true as const,
    metadata: Object.freeze({
      ...version.metadata,
      tags: version.metadata.tags ? [...version.metadata.tags] : undefined,
      attributes: version.metadata.attributes
        ? { ...version.metadata.attributes }
        : undefined,
    }),
    audit: version.audit ? Object.freeze({ ...version.audit }) : undefined,
  });
  assertVersionImmutable(frozen);
  return frozen;
}

export type CreateDocumentInput = {
  definitionId: string;
  organizationId: string;
  actorUserId: string;
  title: string;
  description?: string;
  classification?: DocumentClassification;
  templateId?: string;
  subjectId?: string;
  contentRef?: string;
  contentType?: string;
  byteLength?: number;
  checksum?: string;
  attributes?: Record<string, unknown>;
  tags?: string[];
  actorRoles?: readonly string[];
  actorPermissionKeys?: readonly string[];
};

export async function createDocument(
  input: CreateDocumentInput
): Promise<DocumentResult<{ instance: DocumentInstance; version: DocumentVersion }>> {
  const definition = assertDocumentRegistered(input.definitionId);
  const permission = checkDocumentPermission({
    definition,
    action: "create",
    actorRoles: input.actorRoles,
    actorPermissionKeys: input.actorPermissionKeys,
  });
  if (!permission.allowed) {
    return fail("permission_denied", permission.reason ?? "Not permitted");
  }

  let metadata: DocumentMetadata = {
    title: input.title,
    description: input.description,
    tags: input.tags,
    attributes: input.attributes,
  };

  if (input.templateId) {
    const template = getDocumentTemplate(input.templateId);
    if (!template || template.definitionId !== definition.id) {
      return fail(
        "template_not_found",
        `Template "${input.templateId}" is not registered for this definition`
      );
    }
    metadata = {
      title: metadata.title,
      description: metadata.description ?? template.defaultMetadata?.description as string | undefined,
      tags: metadata.tags ?? (template.defaultMetadata?.tags as string[] | undefined),
      attributes: {
        ...(template.defaultMetadata ?? {}),
        ...(metadata.attributes ?? {}),
      },
    };
  }

  const classification =
    input.classification ?? definition.defaultClassification;
  try {
    assertAllowedClassification(definition, classification);
  } catch (err) {
    return fail(
      "invalid_classification",
      err instanceof Error ? err.message : "Invalid classification"
    );
  }

  const at = iso();
  const instanceId = nextDocumentOpaqueId("doc");
  const versionId = nextDocumentOpaqueId("ver");

  const version = freezeVersion({
    id: versionId,
    instanceId,
    versionNumber: 1,
    createdAt: at,
    createdByUserId: input.actorUserId,
    classification,
    metadata: Object.freeze({ ...metadata }),
    contentRef: input.contentRef,
    contentType: input.contentType,
    byteLength: input.byteLength,
    checksum: input.checksum,
    immutable: true,
    audit: Object.freeze({ reason: "create" }),
  });

  const instance: DocumentInstance = Object.freeze({
    id: instanceId,
    definitionId: definition.id,
    definitionVersion: definition.version,
    organizationId: input.organizationId,
    status: "active",
    classification,
    currentVersionId: versionId,
    currentVersionNumber: 1,
    metadata: Object.freeze({ ...metadata }),
    createdAt: at,
    createdByUserId: input.actorUserId,
    updatedAt: at,
    subjectId: input.subjectId,
    links: Object.freeze([]),
  });

  putDocumentInstance(instance);
  appendDocumentVersion(version);

  const event = emitDocumentEvent({
    type: "document.created",
    instanceId,
    definitionId: definition.id,
    occurredAt: at,
    actorUserId: input.actorUserId,
    versionId,
  });
  trackDocumentTelemetry({
    kind: "create",
    instanceId,
    definitionId: definition.id,
    at,
  });

  const ports = getDocumentExtensions();
  for (const processId of definition.extensions?.processDefinitionIds ?? []) {
    if (ports.processes?.notifyProcess) {
      await ports.processes.notifyProcess({
        processDefinitionId: processId,
        instance,
        eventType: "document.created",
      });
    }
  }

  return { ok: true, value: { instance, version }, events: [event] };
}

export async function updateDocumentMetadata(input: {
  instanceId: DocumentInstanceId;
  actorUserId: string;
  metadata: Partial<DocumentMetadata>;
  classification?: DocumentClassification;
  actorRoles?: readonly string[];
  actorPermissionKeys?: readonly string[];
}): Promise<DocumentResult<{ instance: DocumentInstance }>> {
  const current = getDocumentInstance(input.instanceId);
  if (!current) {
    return fail("instance_not_found", `Document "${input.instanceId}" not found`);
  }
  if (current.status === "archived") {
    return fail("invalid_status", "Cannot update an archived document");
  }

  const definition = assertDocumentRegistered(current.definitionId);
  const permission = checkDocumentPermission({
    definition,
    action: "update",
    actorRoles: input.actorRoles,
    actorPermissionKeys: input.actorPermissionKeys,
  });
  if (!permission.allowed) {
    return fail("permission_denied", permission.reason ?? "Not permitted");
  }

  let classification = current.classification;
  if (input.classification) {
    try {
      assertAllowedClassification(definition, input.classification);
      classification = input.classification;
    } catch (err) {
      return fail(
        "invalid_classification",
        err instanceof Error ? err.message : "Invalid classification"
      );
    }
  }

  const at = iso();
  const instance = mutateInstance(current, {
    metadata: {
      title: input.metadata.title ?? current.metadata.title,
      description:
        input.metadata.description ?? current.metadata.description,
      tags: input.metadata.tags ?? current.metadata.tags,
      attributes: {
        ...(current.metadata.attributes ?? {}),
        ...(input.metadata.attributes ?? {}),
      },
    },
    classification,
    updatedAt: at,
  });

  emitDocumentEvent({
    type: "document.updated",
    instanceId: instance.id,
    definitionId: instance.definitionId,
    occurredAt: at,
    actorUserId: input.actorUserId,
  });
  trackDocumentTelemetry({
    kind: "update",
    instanceId: instance.id,
    definitionId: instance.definitionId,
    at,
  });

  return { ok: true, value: { instance } };
}

export async function versionDocument(input: {
  instanceId: DocumentInstanceId;
  actorUserId: string;
  metadata?: Partial<DocumentMetadata>;
  classification?: DocumentClassification;
  contentRef?: string;
  contentType?: string;
  byteLength?: number;
  checksum?: string;
  reason?: string;
  actorRoles?: readonly string[];
  actorPermissionKeys?: readonly string[];
}): Promise<DocumentResult<{ instance: DocumentInstance; version: DocumentVersion }>> {
  const current = getDocumentInstance(input.instanceId);
  if (!current) {
    return fail("instance_not_found", `Document "${input.instanceId}" not found`);
  }
  if (current.status === "archived") {
    return fail("invalid_status", "Cannot version an archived document");
  }

  const definition = assertDocumentRegistered(current.definitionId);
  const permission = checkDocumentPermission({
    definition,
    action: "version",
    actorRoles: input.actorRoles,
    actorPermissionKeys: input.actorPermissionKeys,
  });
  if (!permission.allowed) {
    return fail("permission_denied", permission.reason ?? "Not permitted");
  }

  const classification = input.classification ?? current.classification;
  try {
    assertAllowedClassification(definition, classification);
  } catch (err) {
    return fail(
      "invalid_classification",
      err instanceof Error ? err.message : "Invalid classification"
    );
  }

  const at = iso();
  const versionNumber = current.currentVersionNumber + 1;
  const versionId = nextDocumentOpaqueId("ver");
  const prior = getDocumentVersion(current.currentVersionId);

  const version = freezeVersion({
    id: versionId,
    instanceId: current.id,
    versionNumber,
    createdAt: at,
    createdByUserId: input.actorUserId,
    classification,
    metadata: Object.freeze({
      title: input.metadata?.title ?? current.metadata.title,
      description:
        input.metadata?.description ?? current.metadata.description,
      tags: input.metadata?.tags ?? current.metadata.tags,
      attributes: {
        ...(current.metadata.attributes ?? {}),
        ...(input.metadata?.attributes ?? {}),
      },
    }),
    contentRef: input.contentRef ?? prior?.contentRef,
    contentType: input.contentType ?? prior?.contentType,
    byteLength: input.byteLength ?? prior?.byteLength,
    checksum: input.checksum ?? prior?.checksum,
    immutable: true,
    audit: Object.freeze({
      reason: input.reason ?? "version",
    }),
  });

  appendDocumentVersion(version);
  const instance = mutateInstance(current, {
    currentVersionId: versionId,
    currentVersionNumber: versionNumber,
    classification,
    metadata: version.metadata,
    updatedAt: at,
  });

  emitDocumentEvent({
    type: "document.versioned",
    instanceId: instance.id,
    definitionId: instance.definitionId,
    occurredAt: at,
    actorUserId: input.actorUserId,
    versionId,
    data: { versionNumber },
  });
  trackDocumentTelemetry({
    kind: "version",
    instanceId: instance.id,
    definitionId: instance.definitionId,
    at,
  });

  return { ok: true, value: { instance, version } };
}

export async function archiveDocument(input: {
  instanceId: DocumentInstanceId;
  actorUserId: string;
  actorRoles?: readonly string[];
  actorPermissionKeys?: readonly string[];
}): Promise<DocumentResult<{ instance: DocumentInstance }>> {
  const current = getDocumentInstance(input.instanceId);
  if (!current) {
    return fail("instance_not_found", `Document "${input.instanceId}" not found`);
  }
  if (current.status === "archived") {
    return fail("invalid_status", "Document is already archived");
  }

  const definition = assertDocumentRegistered(current.definitionId);
  const permission = checkDocumentPermission({
    definition,
    action: "archive",
    actorRoles: input.actorRoles,
    actorPermissionKeys: input.actorPermissionKeys,
  });
  if (!permission.allowed) {
    return fail("permission_denied", permission.reason ?? "Not permitted");
  }

  const at = iso();
  const instance = mutateInstance(current, {
    status: "archived",
    archivedAt: at,
    updatedAt: at,
  });

  emitDocumentEvent({
    type: "document.archived",
    instanceId: instance.id,
    definitionId: instance.definitionId,
    occurredAt: at,
    actorUserId: input.actorUserId,
  });
  trackDocumentTelemetry({
    kind: "archive",
    instanceId: instance.id,
    definitionId: instance.definitionId,
    at,
  });

  return { ok: true, value: { instance } };
}

export async function restoreDocument(input: {
  instanceId: DocumentInstanceId;
  actorUserId: string;
  /** Restore current pointer to a historical version (rollback metadata). */
  toVersionId?: string;
  actorRoles?: readonly string[];
  actorPermissionKeys?: readonly string[];
}): Promise<DocumentResult<{ instance: DocumentInstance }>> {
  const current = getDocumentInstance(input.instanceId);
  if (!current) {
    return fail("instance_not_found", `Document "${input.instanceId}" not found`);
  }

  const definition = assertDocumentRegistered(current.definitionId);
  const permission = checkDocumentPermission({
    definition,
    action: "restore",
    actorRoles: input.actorRoles,
    actorPermissionKeys: input.actorPermissionKeys,
  });
  if (!permission.allowed) {
    return fail("permission_denied", permission.reason ?? "Not permitted");
  }

  let targetVersion = getDocumentVersion(
    input.toVersionId ?? current.currentVersionId
  );
  if (input.toVersionId) {
    targetVersion = getDocumentVersion(input.toVersionId);
    if (!targetVersion || targetVersion.instanceId !== current.id) {
      return fail("version_not_found", "Historical version not found");
    }
  }
  if (!targetVersion) {
    return fail("version_not_found", "No version available to restore");
  }

  const at = iso();
  const instance = mutateInstance(current, {
    status: "restored",
    restoredAt: at,
    updatedAt: at,
    currentVersionId: targetVersion.id,
    currentVersionNumber: targetVersion.versionNumber,
    classification: targetVersion.classification,
    metadata: targetVersion.metadata,
  });

  // Active after restore completes.
  const active = mutateInstance(instance, { status: "active" });

  emitDocumentEvent({
    type: "document.restored",
    instanceId: active.id,
    definitionId: active.definitionId,
    occurredAt: at,
    actorUserId: input.actorUserId,
    versionId: targetVersion.id,
    data: {
      rollbackToVersionNumber: targetVersion.versionNumber,
    },
  });
  trackDocumentTelemetry({
    kind: "restore",
    instanceId: active.id,
    definitionId: active.definitionId,
    at,
  });

  return { ok: true, value: { instance: active } };
}

export async function linkDocument(input: {
  instanceId: DocumentInstanceId;
  actorUserId: string;
  reference: Omit<DocumentReference, "linkedAt" | "linkedByUserId">;
  actorRoles?: readonly string[];
  actorPermissionKeys?: readonly string[];
}): Promise<DocumentResult<{ instance: DocumentInstance }>> {
  const current = getDocumentInstance(input.instanceId);
  if (!current) {
    return fail("instance_not_found", `Document "${input.instanceId}" not found`);
  }

  const definition = assertDocumentRegistered(current.definitionId);
  const permission = checkDocumentPermission({
    definition,
    action: "link",
    actorRoles: input.actorRoles,
    actorPermissionKeys: input.actorPermissionKeys,
  });
  if (!permission.allowed) {
    return fail("permission_denied", permission.reason ?? "Not permitted");
  }

  const at = iso();
  const link: DocumentReference = Object.freeze({
    ...input.reference,
    linkedAt: at,
    linkedByUserId: input.actorUserId,
  });

  const instance = mutateInstance(current, {
    links: [...current.links, link],
    updatedAt: at,
  });

  emitDocumentEvent({
    type: "document.linked",
    instanceId: instance.id,
    definitionId: instance.definitionId,
    occurredAt: at,
    actorUserId: input.actorUserId,
    data: { kind: link.kind, targetId: link.targetId },
  });

  const ports = getDocumentExtensions();
  if (link.kind === "entity" && ports.entities?.linkEntity) {
    await ports.entities.linkEntity({
      entityTypeId: "entity",
      subjectId: link.targetId,
      instance,
    });
  }

  return { ok: true, value: { instance } };
}

export function validateDocument(instanceId: DocumentInstanceId): DocumentResult<{
  instance: DocumentInstance;
  versionCount: number;
}> {
  const instance = getDocumentInstance(instanceId);
  if (!instance) {
    return fail("instance_not_found", `Document "${instanceId}" not found`);
  }
  assertDocumentRegistered(instance.definitionId);
  const versions = listDocumentVersions(instanceId);
  for (const v of versions) assertVersionImmutable(v);

  const current = getDocumentVersion(instance.currentVersionId);
  if (!current) {
    return fail("version_not_found", "Current version missing from history");
  }

  emitDocumentEvent({
    type: "document.validated",
    instanceId: instance.id,
    definitionId: instance.definitionId,
    occurredAt: iso(),
    versionId: current.id,
    data: { versionCount: versions.length },
  });

  return {
    ok: true,
    value: { instance, versionCount: versions.length },
  };
}

export function accessDocument(input: {
  instanceId: DocumentInstanceId;
  actorUserId: string;
}): DocumentResult<{ instance: DocumentInstance; accessCount: number }> {
  const instance = getDocumentInstance(input.instanceId);
  if (!instance) {
    return fail("instance_not_found", `Document "${input.instanceId}" not found`);
  }
  const accessCount = incrementDocumentAccess(instance.id);
  const at = iso();
  emitDocumentEvent({
    type: "document.accessed",
    instanceId: instance.id,
    definitionId: instance.definitionId,
    occurredAt: at,
    actorUserId: input.actorUserId,
    data: { accessCount },
  });
  trackDocumentTelemetry({
    kind: "access",
    instanceId: instance.id,
    definitionId: instance.definitionId,
    at,
  });
  return { ok: true, value: { instance, accessCount } };
}

export function getDocumentMetrics(
  instanceId: DocumentInstanceId
): DocumentMetrics | null {
  const instance = getDocumentInstance(instanceId);
  if (!instance) return null;
  const versions = orderVersionsAscending(listDocumentVersions(instanceId));
  const last = versions[versions.length - 1];
  return {
    instanceId: instance.id,
    definitionId: instance.definitionId,
    versionCount: versions.length,
    linkCount: instance.links.length,
    createdAt: instance.createdAt,
    lastVersionAt: last?.createdAt ?? instance.createdAt,
    accessCount: getDocumentAccessCount(instanceId),
  };
}

export const DocumentRuntime = {
  create: createDocument,
  updateMetadata: updateDocumentMetadata,
  version: versionDocument,
  archive: archiveDocument,
  restore: restoreDocument,
  link: linkDocument,
  validate: validateDocument,
  access: accessDocument,
  getInstance: getDocumentInstance,
  listVersions: listDocumentVersions,
  getMetrics: getDocumentMetrics,
} as const;
