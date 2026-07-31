/**
 * Evidence Catalog™ process-local store.
 * Durable schema: migrations 203 + 204.
 */

import type {
  EvidenceDocument,
  EvidenceRelationship,
  EvidenceVersion,
} from "@/lib/evidence-center/types";
import { DEFAULT_BUSINESS_UNITS } from "@/lib/evidence-center/types";
import { resetPipelineStoreForTests } from "@/lib/evidence-center/pipeline/store";
import { resetKnowledgeGraphStoreForTests } from "@/lib/evidence-center/knowledge-graph/store";

const globalStore = globalThis as typeof globalThis & {
  __jagEvidenceDocs?: Map<string, EvidenceDocument>;
  __jagEvidenceVersions?: Map<string, EvidenceVersion>;
  __jagEvidenceRelationships?: Map<string, EvidenceRelationship>;
  __jagEvidenceBusinessUnits?: Map<string, string[]>;
};

function docs(): Map<string, EvidenceDocument> {
  if (!globalStore.__jagEvidenceDocs) {
    globalStore.__jagEvidenceDocs = new Map();
  }
  return globalStore.__jagEvidenceDocs;
}

function versions(): Map<string, EvidenceVersion> {
  if (!globalStore.__jagEvidenceVersions) {
    globalStore.__jagEvidenceVersions = new Map();
  }
  return globalStore.__jagEvidenceVersions;
}

function relationships(): Map<string, EvidenceRelationship> {
  if (!globalStore.__jagEvidenceRelationships) {
    globalStore.__jagEvidenceRelationships = new Map();
  }
  return globalStore.__jagEvidenceRelationships;
}

function businessUnits(): Map<string, string[]> {
  if (!globalStore.__jagEvidenceBusinessUnits) {
    globalStore.__jagEvidenceBusinessUnits = new Map();
  }
  return globalStore.__jagEvidenceBusinessUnits;
}

export function resetEvidenceStoreForTests(): void {
  docs().clear();
  versions().clear();
  relationships().clear();
  businessUnits().clear();
  resetPipelineStoreForTests();
  resetKnowledgeGraphStoreForTests();
}

export function saveEvidenceDocument(doc: EvidenceDocument): void {
  docs().set(doc.id, doc);
}

export function getEvidenceDocument(
  id: string
): EvidenceDocument | undefined {
  return docs().get(id);
}

export function listEvidenceForOrganization(
  organizationId: string
): readonly EvidenceDocument[] {
  return Object.freeze(
    [...docs().values()]
      .filter((d) => d.organizationId === organizationId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  );
}

export function updateEvidenceDocument(
  id: string,
  patch: Partial<EvidenceDocument>
): EvidenceDocument | undefined {
  const current = docs().get(id);
  if (!current) return undefined;
  const next: EvidenceDocument = {
    ...current,
    ...patch,
    id: current.id,
    organizationId: current.organizationId,
    updatedAt: new Date().toISOString(),
  };
  docs().set(id, next);
  return next;
}

export function saveEvidenceVersion(version: EvidenceVersion): void {
  versions().set(version.id, version);
}

export function listVersionsForDocument(
  organizationId: string,
  documentId: string
): readonly EvidenceVersion[] {
  return Object.freeze(
    [...versions().values()]
      .filter(
        (v) =>
          v.organizationId === organizationId && v.documentId === documentId
      )
      .sort((a, b) => b.versionNumber - a.versionNumber)
  );
}

export function getEvidenceVersion(
  versionId: string
): EvidenceVersion | undefined {
  return versions().get(versionId);
}

export function saveEvidenceRelationship(
  relationship: EvidenceRelationship
): void {
  relationships().set(relationship.id, relationship);
}

export function listRelationshipsForDocument(
  organizationId: string,
  documentId: string
): readonly EvidenceRelationship[] {
  return Object.freeze(
    [...relationships().values()].filter(
      (r) =>
        r.organizationId === organizationId &&
        (r.fromDocumentId === documentId || r.toDocumentId === documentId)
    )
  );
}

export function listBusinessUnitsForOrganization(
  organizationId: string
): readonly string[] {
  const map = businessUnits();
  if (!map.has(organizationId)) {
    map.set(organizationId, [...DEFAULT_BUSINESS_UNITS]);
  }
  return Object.freeze([...(map.get(organizationId) ?? [])]);
}

export function addBusinessUnitForOrganization(
  organizationId: string,
  name: string
): readonly string[] {
  const current = [...listBusinessUnitsForOrganization(organizationId)];
  const trimmed = name.trim();
  if (trimmed && !current.some((u) => u.toLowerCase() === trimmed.toLowerCase())) {
    current.push(trimmed);
    businessUnits().set(organizationId, current);
  }
  return listBusinessUnitsForOrganization(organizationId);
}
