import type { DocumentVersionRow } from "./types";

export function compareVersions(
  a: DocumentVersionRow,
  b: DocumentVersionRow
): {
  titleChanged: boolean;
  descriptionChanged: boolean;
  fileChanged: boolean;
  a: DocumentVersionRow;
  b: DocumentVersionRow;
} {
  return {
    titleChanged: a.title !== b.title,
    descriptionChanged: a.description !== b.description,
    fileChanged:
      a.file_url !== b.file_url ||
      a.storage_path !== b.storage_path ||
      a.file_name !== b.file_name,
    a,
    b,
  };
}
