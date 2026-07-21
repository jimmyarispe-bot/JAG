/**
 * Inline preview capability matrix.
 * Office docs are future-provider ready (no live converter yet).
 */

export type PreviewKind = "pdf" | "image" | "text" | "office" | "unsupported";

export function detectPreviewKind(mimeType: string | null | undefined): PreviewKind {
  if (!mimeType) return "unsupported";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.startsWith("image/")) return "image";
  if (
    mimeType === "text/plain" ||
    mimeType === "text/csv" ||
    mimeType.startsWith("text/")
  ) {
    return "text";
  }
  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "application/msword" ||
    mimeType === "application/vnd.ms-excel"
  ) {
    return "office";
  }
  return "unsupported";
}

export function canInlinePreview(mimeType: string | null | undefined): boolean {
  const kind = detectPreviewKind(mimeType);
  return kind === "pdf" || kind === "image" || kind === "text";
}
