/**
 * Phase 3 — bulk queue item model + selection/validation for Evidence uploads.
 * Reuses Phase 2 validateJagEvidenceFileInput. Does not upload.
 */

import { validateJagEvidenceFileInput } from "@/lib/evidence-center/validate-file";
import {
  MAX_BULK_EVIDENCE_FILES,
} from "@/lib/evidence-center/bulk-constants";
import { stemFromFilename } from "@/lib/evidence-center/upload-file-selection";

export type EvidenceQueueValidationStatus = "valid" | "invalid";

export type EvidenceQueueUploadStatus =
  | "pending"
  | "uploading"
  | "success"
  | "failed"
  | "skipped";

export type EvidenceUploadQueueItem = {
  readonly clientId: string;
  readonly file: File;
  readonly displayName: string;
  readonly byteSize: number;
  readonly mimeType: string;
  /** Per-document name sent to authorize (filename stem, or single-file override). */
  readonly documentName: string;
  readonly validationStatus: EvidenceQueueValidationStatus;
  readonly validationError: string | null;
  readonly uploadStatus: EvidenceQueueUploadStatus;
  readonly progress: number | null;
  readonly documentId: string | null;
  readonly versionId: string | null;
  readonly error: string | null;
};

export type EvidenceBatchSelectionResult =
  | { readonly kind: "unchanged" }
  | {
      readonly kind: "selected";
      readonly items: readonly EvidenceUploadQueueItem[];
      /** Shared Evidence Name field value for single-file UX. */
      readonly evidenceName: string;
      readonly overflowCount: number;
    };

let clientIdSeq = 0;
export function nextEvidenceQueueClientId(): string {
  clientIdSeq += 1;
  return `evq-${Date.now()}-${clientIdSeq}`;
}

/** Test-only reset for deterministic ids when needed. */
export function resetEvidenceQueueClientIdForTests(): void {
  clientIdSeq = 0;
}

function buildQueueItem(input: {
  file: File;
  documentName: string;
  overflow: boolean;
}): EvidenceUploadQueueItem {
  const displayName = input.file.name;
  const byteSize = input.file.size;
  const mimeType = input.file.type || "";

  if (input.overflow) {
    return {
      clientId: nextEvidenceQueueClientId(),
      file: input.file,
      displayName,
      byteSize,
      mimeType,
      documentName: input.documentName,
      validationStatus: "invalid",
      validationError: `Batch limit is ${MAX_BULK_EVIDENCE_FILES} files. This file exceeds the limit and will not be uploaded.`,
      uploadStatus: "skipped",
      progress: null,
      documentId: null,
      versionId: null,
      error: null,
    };
  }

  const validated = validateJagEvidenceFileInput({
    filename: input.file.name,
    mimeType: input.file.type,
    byteSize: input.file.size,
  });

  if (!validated.ok) {
    return {
      clientId: nextEvidenceQueueClientId(),
      file: input.file,
      displayName,
      byteSize,
      mimeType,
      documentName: input.documentName,
      validationStatus: "invalid",
      validationError: validated.error,
      uploadStatus: "skipped",
      progress: null,
      documentId: null,
      versionId: null,
      error: null,
    };
  }

  return {
    clientId: nextEvidenceQueueClientId(),
    file: input.file,
    displayName,
    byteSize: validated.byteSize,
    mimeType: validated.mimeType,
    documentName: input.documentName,
    validationStatus: "valid",
    validationError: null,
    uploadStatus: "pending",
    progress: null,
    documentId: null,
    versionId: null,
    error: null,
  };
}

/**
 * Replace-or-unchanged batch selection for multi-file picker / drop.
 * Empty FileList (cancel) leaves the previous queue untouched.
 */
export function resolveEvidenceUploadBatchSelection(input: {
  readonly previousItems: readonly EvidenceUploadQueueItem[];
  readonly evidenceName: string;
  readonly pickedFiles: ArrayLike<File> | null | undefined;
}): EvidenceBatchSelectionResult {
  const count = input.pickedFiles?.length ?? 0;
  if (!input.pickedFiles || count <= 0) {
    return { kind: "unchanged" };
  }

  const files: File[] = [];
  for (let i = 0; i < count; i += 1) {
    const f = input.pickedFiles[i];
    if (f) files.push(f);
  }
  if (files.length === 0) {
    return { kind: "unchanged" };
  }

  const single = files.length === 1;
  const previousSingle = input.previousItems.length === 1 ? input.previousItems[0] : null;
  const previousStem = previousSingle
    ? stemFromFilename(previousSingle.file.name)
    : "";
  const nameTrimmed = input.evidenceName.trim();

  let evidenceName = input.evidenceName;
  if (single) {
    const nextStem = stemFromFilename(files[0]!.name);
    const shouldReplaceEvidenceName =
      !nameTrimmed ||
      (previousStem.length > 0 && nameTrimmed === previousStem) ||
      (previousSingle != null && nameTrimmed === previousSingle.documentName);
    evidenceName = shouldReplaceEvidenceName ? nextStem : input.evidenceName;
  }

  const items: EvidenceUploadQueueItem[] = files.map((file, index) => {
    const overflow = index >= MAX_BULK_EVIDENCE_FILES;
    const documentName = single
      ? evidenceName.trim() || stemFromFilename(file.name)
      : stemFromFilename(file.name);
    return buildQueueItem({ file, documentName, overflow });
  });

  const overflowCount = Math.max(0, files.length - MAX_BULK_EVIDENCE_FILES);

  return {
    kind: "selected",
    items,
    evidenceName: single ? evidenceName : "",
    overflowCount,
  };
}

export function countValidPending(items: readonly EvidenceUploadQueueItem[]): number {
  return items.filter(
    (i) => i.validationStatus === "valid" && (i.uploadStatus === "pending" || i.uploadStatus === "failed")
  ).length;
}

export function summarizeEvidenceQueue(items: readonly EvidenceUploadQueueItem[]): {
  readonly total: number;
  readonly valid: number;
  readonly invalid: number;
  readonly success: number;
  readonly failed: number;
  readonly pending: number;
  readonly uploading: number;
} {
  let valid = 0;
  let invalid = 0;
  let success = 0;
  let failed = 0;
  let pending = 0;
  let uploading = 0;
  for (const item of items) {
    if (item.validationStatus === "valid") valid += 1;
    else invalid += 1;
    if (item.uploadStatus === "success") success += 1;
    else if (item.uploadStatus === "failed") failed += 1;
    else if (item.uploadStatus === "pending") pending += 1;
    else if (item.uploadStatus === "uploading") uploading += 1;
  }
  return {
    total: items.length,
    valid,
    invalid,
    success,
    failed,
    pending,
    uploading,
  };
}

/**
 * Modal Cancel/Close clears the pending batch UI state.
 * Native file-picker Cancel is separate and must leave selection unchanged.
 * Shared form metadata (domain, period, etc.) is intentionally preserved.
 */
export type EvidenceUploadModalBatchUiState = {
  readonly queue: readonly EvidenceUploadQueueItem[];
  readonly evidenceName: string;
  readonly error: string;
  readonly batchSummary: string;
  readonly loading: boolean;
  readonly dragOver: boolean;
  readonly fileInputKey: number;
};

export function clearEvidenceUploadModalBatchState(
  previous: EvidenceUploadModalBatchUiState
): EvidenceUploadModalBatchUiState {
  return {
    queue: [],
    evidenceName: "",
    error: "",
    batchSummary: "",
    loading: false,
    dragOver: false,
    fileInputKey: previous.fileInputKey + 1,
  };
}
