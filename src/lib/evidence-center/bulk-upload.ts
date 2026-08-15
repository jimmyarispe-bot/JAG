/**
 * Phase 3 — bulk upload orchestration over proven single-file authorize→PUT→complete.
 * Partial failure is intentional; bounded concurrency; no bytes through Next.js.
 */

import { MAX_BULK_EVIDENCE_CONCURRENCY } from "@/lib/evidence-center/bulk-constants";
import type { EvidenceUploadQueueItem } from "@/lib/evidence-center/bulk-queue";
import { runJagEvidenceSingleUpload } from "@/lib/evidence-center/client-upload";

export type BulkSharedEvidenceMetadata = {
  readonly domain?: string;
  readonly evidenceType?: string;
  readonly description?: string;
  readonly tags?: readonly string[];
  readonly reportingPeriodKind?: string;
  readonly reportingPeriodLabel?: string;
  readonly businessUnit?: string;
  readonly department?: string;
  readonly location?: string;
  readonly owner?: string;
  readonly source?: string;
  readonly confidentiality?: string;
};

export type BulkUploadOneFn = (input: {
  organizationId: string;
  organizationName: string;
  file: File;
  mode?: "create" | "version";
  documentId?: string;
  metadata?: Record<string, unknown>;
}) => Promise<{ documentId: string; versionId: string }>;

/**
 * Run async work over items with a fixed concurrency pool.
 * Failures are captured per item — the pool does not abort siblings.
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const limit = Math.max(1, Math.floor(concurrency));
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function runWorker(): Promise<void> {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= items.length) return;
      results[index] = await worker(items[index]!, index);
    }
  }

  const runners = Array.from({ length: Math.min(limit, items.length) }, () =>
    runWorker()
  );
  await Promise.all(runners);
  return results;
}

export function selectItemsForBulkUpload(
  items: readonly EvidenceUploadQueueItem[],
  mode: "all-valid-pending" | "failed-only"
): EvidenceUploadQueueItem[] {
  if (mode === "failed-only") {
    return items.filter(
      (i) => i.validationStatus === "valid" && i.uploadStatus === "failed"
    );
  }
  return items.filter(
    (i) =>
      i.validationStatus === "valid" &&
      (i.uploadStatus === "pending" || i.uploadStatus === "failed")
  );
}

/**
 * Upload each eligible queue item via the single-file pipeline.
 * Successful items are never re-uploaded when mode is failed-only.
 */
export async function runJagEvidenceBulkUpload(input: {
  readonly organizationId: string;
  readonly organizationName: string;
  readonly items: readonly EvidenceUploadQueueItem[];
  readonly sharedMetadata: BulkSharedEvidenceMetadata;
  readonly mode?: "all-valid-pending" | "failed-only";
  readonly concurrency?: number;
  readonly uploadOne?: BulkUploadOneFn;
  readonly onItemUpdate?: (item: EvidenceUploadQueueItem) => void;
}): Promise<EvidenceUploadQueueItem[]> {
  const concurrency = input.concurrency ?? MAX_BULK_EVIDENCE_CONCURRENCY;
  const uploadOne = input.uploadOne ?? runJagEvidenceSingleUpload;
  const mode = input.mode ?? "all-valid-pending";

  const working = input.items.map((item) => ({ ...item }));
  const byId = new Map(working.map((item) => [item.clientId, item]));

  const eligible = selectItemsForBulkUpload(working, mode);

  // Mark non-eligible valid pending as untouched; invalid stay skipped.
  await mapWithConcurrency(eligible, concurrency, async (item) => {
    const current = byId.get(item.clientId);
    if (!current) return item;

    const uploading: EvidenceUploadQueueItem = {
      ...current,
      uploadStatus: "uploading",
      progress: 0,
      error: null,
    };
    byId.set(item.clientId, uploading);
    input.onItemUpdate?.(uploading);

    try {
      const result = await uploadOne({
        organizationId: input.organizationId,
        organizationName: input.organizationName,
        file: current.file,
        mode: "create",
        metadata: {
          name: current.documentName,
          domain: input.sharedMetadata.domain,
          evidenceType: input.sharedMetadata.evidenceType,
          description: input.sharedMetadata.description,
          tags: input.sharedMetadata.tags ? [...input.sharedMetadata.tags] : [],
          reportingPeriodKind: input.sharedMetadata.reportingPeriodKind,
          reportingPeriodLabel: input.sharedMetadata.reportingPeriodLabel,
          businessUnit: input.sharedMetadata.businessUnit,
          department: input.sharedMetadata.department,
          location: input.sharedMetadata.location,
          owner: input.sharedMetadata.owner,
          source: input.sharedMetadata.source,
          confidentiality: input.sharedMetadata.confidentiality,
        },
      });

      const success: EvidenceUploadQueueItem = {
        ...uploading,
        uploadStatus: "success",
        progress: 100,
        documentId: result.documentId,
        versionId: result.versionId,
        error: null,
      };
      byId.set(item.clientId, success);
      input.onItemUpdate?.(success);
      return success;
    } catch (err) {
      const failed: EvidenceUploadQueueItem = {
        ...uploading,
        uploadStatus: "failed",
        progress: null,
        error: err instanceof Error ? err.message : "Upload failed.",
      };
      byId.set(item.clientId, failed);
      input.onItemUpdate?.(failed);
      return failed;
    }
  });

  return input.items.map((original) => byId.get(original.clientId) ?? original);
}
