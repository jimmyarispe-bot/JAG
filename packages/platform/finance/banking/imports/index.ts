/**
 * Statement import facade — CSV / OFX / QBO / Excel / PDF registration.
 * OCR hooks are registered for PDF only (future processing).
 */

export {
  previewStatementImport,
  validateStatementImport,
  commitStatementImport,
  rollbackStatementImport,
  listStatementBatches,
  getStatementBatch,
  type PreviewRow,
} from "../statements";

export const SUPPORTED_IMPORT_FORMATS = Object.freeze([
  "csv",
  "ofx",
  "qbo",
  "excel",
  "pdf",
] as const);

export const OCR_HOOK = Object.freeze({
  ready: true as const,
  formats: Object.freeze(["pdf"] as const),
  note: "PDF imports register metadata; OCR processing is a future sprint.",
});
