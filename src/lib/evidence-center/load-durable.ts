/**
 * Server loaders for durable Evidence documents (Phase 2).
 * Production is durable-only — never fall back to in-memory fixtures.
 */

import {
  getDurableDocument,
  listDurableDocumentsForOrganization,
  listDurableVersionsForDocument,
  mapDurableDocumentToCatalog,
  mapDurableVersionToCatalog,
} from "@/lib/evidence-center/durable-repository";
import { isJagEvidenceMemoryFallbackEnabled } from "@/lib/evidence-center/memory-fallback";
import { createJagEvidenceUploadDeps } from "@/lib/evidence-center/upload-deps";
import type {
  CatalogDashboardSummary,
  EvidenceDocument,
  EvidenceVersion,
} from "@/lib/evidence-center/types";
import {
  getEvidenceForOrganization as getMemoryEvidence,
  getVersionsForOrganization as getMemoryVersions,
} from "@/lib/evidence-center/service";
import { listEvidenceForOrganization as listMemoryEvidence } from "@/lib/evidence-center/store";

function filterByQuery(
  documents: EvidenceDocument[],
  query?: string
): EvidenceDocument[] {
  const q = query?.trim().toLowerCase();
  if (!q) return documents;
  return documents.filter((doc) => {
    const haystack = [
      doc.name,
      doc.domain,
      doc.evidenceType,
      doc.description,
      doc.fileName,
      ...doc.tags,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

function buildDashboard(docs: EvidenceDocument[]): CatalogDashboardSummary {
  const byDomain: Record<string, number> = {};
  const byType: Record<string, number> = {};
  const byReportingPeriod: Record<string, number> = {};
  for (const doc of docs) {
    byDomain[doc.domain] = (byDomain[doc.domain] ?? 0) + 1;
    byType[doc.evidenceType] = (byType[doc.evidenceType] ?? 0) + 1;
    const period = doc.reportingPeriodLabel || "Unspecified";
    byReportingPeriod[period] = (byReportingPeriod[period] ?? 0) + 1;
  }
  return {
    byDomain,
    byType,
    byReportingPeriod,
    recentUploads: docs.slice(0, 5),
    awaitingReview: docs.filter((d) => d.status === "awaiting_review").length,
    latestVersionCount: docs.filter((d) => d.currentVersion >= 1).length,
  };
}

function emptyCatalogOptions(): { id: string; name: string }[] {
  return [];
}

export async function loadDurableEvidenceCatalog(input: {
  organizationId: string;
  organizationName: string;
  query?: string;
}): Promise<{
  documents: EvidenceDocument[];
  dashboard: CatalogDashboardSummary;
}> {
  let durableDocs: EvidenceDocument[] = [];
  try {
    const deps = createJagEvidenceUploadDeps();
    const rows = await listDurableDocumentsForOrganization(
      deps.db,
      input.organizationId
    );
    durableDocs = rows.map((row) =>
      mapDurableDocumentToCatalog(row, input.organizationName)
    );
  } catch {
    durableDocs = [];
  }

  let base = durableDocs;
  if (
    base.length === 0 &&
    isJagEvidenceMemoryFallbackEnabled()
  ) {
    base = [...listMemoryEvidence(input.organizationId)];
  }

  const documents = filterByQuery(base, input.query);
  return { documents, dashboard: buildDashboard(documents) };
}

export async function loadDurableEvidenceDocument(input: {
  organizationId: string;
  organizationName: string;
  documentId: string;
}): Promise<{
  document: EvidenceDocument | null;
  versions: EvidenceVersion[];
  catalogOptions: { id: string; name: string }[];
}> {
  try {
    const deps = createJagEvidenceUploadDeps();
    const row = await getDurableDocument(
      deps.db,
      input.organizationId,
      input.documentId
    );
    if (row) {
      const versions = await listDurableVersionsForDocument(
        deps.db,
        input.organizationId,
        input.documentId
      );
      const all = await listDurableDocumentsForOrganization(
        deps.db,
        input.organizationId
      );
      return {
        document: mapDurableDocumentToCatalog(row, input.organizationName),
        versions: versions.map((v, index) => ({
          ...mapDurableVersionToCatalog(v),
          isLatest: index === 0,
          superseded: index !== 0,
        })),
        catalogOptions: all.map((d) => ({ id: d.id, name: d.name })),
      };
    }
  } catch {
    // Durable miss/error — optional memory fallback below.
  }

  if (!isJagEvidenceMemoryFallbackEnabled()) {
    return {
      document: null,
      versions: [],
      catalogOptions: emptyCatalogOptions(),
    };
  }

  const memory = getMemoryEvidence(input.organizationId, input.documentId);
  return {
    document: memory ?? null,
    versions: memory
      ? [...getMemoryVersions(input.organizationId, input.documentId)]
      : [],
    catalogOptions: listMemoryEvidence(input.organizationId).map((item) => ({
      id: item.id,
      name: item.name,
    })),
  };
}
