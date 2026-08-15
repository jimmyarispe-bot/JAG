/**
 * Phase 2 — file validation for JAG Evidence uploads (server + shared rules).
 */

import {
  extensionOfFilename,
  isAllowedJagEvidenceFilename,
  JAG_EVIDENCE_MAX_BYTES,
  sanitizeJagEvidenceFilename,
} from "@/lib/evidence-center/storage";

const EXT_TO_CANONICAL_MIME: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  csv: "text/csv",
  txt: "text/plain",
};

/** MIME types accepted for an extension (browsers vary for CSV). */
const EXT_TO_ALLOWED_MIMES: Record<string, readonly string[]> = {
  pdf: ["application/pdf"],
  docx: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  xlsx: [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
  pptx: [
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ],
  csv: ["text/csv", "application/csv", "text/plain"],
  txt: ["text/plain"],
};

export type JagEvidenceFileValidationResult =
  | {
      readonly ok: true;
      readonly originalFilename: string;
      readonly safeFilename: string;
      readonly mimeType: string;
      readonly byteSize: number;
      readonly extension: string;
    }
  | { readonly ok: false; readonly error: string };

export function validateJagEvidenceFileInput(input: {
  filename: string;
  mimeType?: string | null;
  byteSize: number;
}): JagEvidenceFileValidationResult {
  const originalFilename = input.filename?.trim() ?? "";
  if (!originalFilename) {
    return { ok: false, error: "Filename is required." };
  }
  if (originalFilename.includes("\0")) {
    return { ok: false, error: "Unsafe filename." };
  }

  const safeFilename = sanitizeJagEvidenceFilename(originalFilename);
  if (!isAllowedJagEvidenceFilename(safeFilename)) {
    return {
      ok: false,
      error: "Unsupported file type. Use PDF, DOCX, XLSX, CSV, PPTX, or TXT.",
    };
  }

  const byteSize = Number(input.byteSize);
  if (!Number.isFinite(byteSize) || byteSize <= 0) {
    return { ok: false, error: "File is empty or invalid size." };
  }
  if (byteSize > JAG_EVIDENCE_MAX_BYTES) {
    return {
      ok: false,
      error: `File exceeds the ${JAG_EVIDENCE_MAX_BYTES / (1024 * 1024)} MiB limit.`,
    };
  }

  const extension = extensionOfFilename(safeFilename);
  const allowedForExt = EXT_TO_ALLOWED_MIMES[extension] ?? [];
  const canonical = EXT_TO_CANONICAL_MIME[extension] ?? "application/octet-stream";
  const rawMime = (input.mimeType ?? "").trim().toLowerCase();

  if (rawMime && !allowedForExt.includes(rawMime)) {
    return {
      ok: false,
      error: "MIME type does not match the file extension.",
    };
  }

  let mimeType = rawMime || canonical;
  if (mimeType === "application/csv" || (mimeType === "text/plain" && extension === "csv")) {
    mimeType = "text/csv";
  }

  return {
    ok: true,
    originalFilename,
    safeFilename,
    mimeType,
    byteSize,
    extension,
  };
}
