/**
 * Pure file-selection semantics for Evidence Center upload UI.
 * Cancel (empty FileList) must not clear an existing selection.
 * A new pick always replaces the previous File object.
 */

export type EvidenceUploadFileSelection =
  | { readonly kind: "unchanged" }
  | {
      readonly kind: "selected";
      readonly file: File;
      readonly evidenceName: string;
      readonly displayName: string;
      readonly byteSize: number;
      readonly mimeType: string;
    };

export function stemFromFilename(filename: string): string {
  const trimmed = filename.trim();
  const dot = trimmed.lastIndexOf(".");
  if (dot <= 0) return trimmed;
  return trimmed.slice(0, dot);
}

/**
 * Resolve the next upload selection from a file picker or drop event.
 */
export function resolveEvidenceUploadFileSelection(input: {
  readonly previousFile: File | null;
  readonly evidenceName: string;
  readonly pickedFiles: ArrayLike<File> | null | undefined;
}): EvidenceUploadFileSelection {
  const count = input.pickedFiles?.length ?? 0;
  if (!input.pickedFiles || count <= 0) {
    return { kind: "unchanged" };
  }

  const file = input.pickedFiles[0];
  if (!file) {
    return { kind: "unchanged" };
  }

  const previousStem = input.previousFile
    ? stemFromFilename(input.previousFile.name)
    : "";
  const nextStem = stemFromFilename(file.name);
  const nameTrimmed = input.evidenceName.trim();
  const shouldReplaceEvidenceName =
    !nameTrimmed ||
    (previousStem.length > 0 && nameTrimmed === previousStem) ||
    nameTrimmed === stemFromFilename(input.previousFile?.name ?? "");

  return {
    kind: "selected",
    file,
    evidenceName: shouldReplaceEvidenceName ? nextStem : input.evidenceName,
    displayName: file.name,
    byteSize: file.size,
    mimeType: file.type || "",
  };
}
