import type {
  ConnectorMappingInterface,
  MappedEvidenceDraft,
} from "@/lib/connectors/mapping";
import {
  GWS_CONNECTOR_ID,
  type GwsDriveFileMeta,
} from "@/lib/connectors/google-workspace/types";

export function driveFileBecomesEvidence(file: GwsDriveFileMeta): boolean {
  return file.kind === "pdf" || file.kind === "docx" || file.kind === "sheet" || file.kind === "slides";
}

export function mapDriveFileToEvidenceDraft(
  file: GwsDriveFileMeta
): MappedEvidenceDraft {
  return {
    name: file.name,
    domain: "Operations Intelligence",
    evidenceType:
      file.kind === "sheet"
        ? "Spreadsheet"
        : file.kind === "slides"
          ? "Presentation"
          : file.kind === "docx"
            ? "Policy"
            : "Other",
    source: "Google Workspace",
    metadata: {
      connectorId: GWS_CONNECTOR_ID,
      driveFileId: file.id,
      mimeType: file.mimeType,
      kind: file.kind,
      modifiedTime: file.modifiedTime,
    },
  };
}

/** Metadata stub only — content is never downloaded; stored as .txt JSON. */
export function driveEvidenceFileName(file: GwsDriveFileMeta): string {
  const base = file.name
    .replace(/\.[^.]+$/, "")
    .replace(/[^\w.\-]+/g, "_")
    .slice(0, 80);
  return `gws-drive-${base || file.id}.txt`;
}

export const googleWorkspaceMapping: ConnectorMappingInterface = {
  connectorId: GWS_CONNECTOR_ID,
  mapToEvidence(record) {
    const file = record.payload as unknown as GwsDriveFileMeta;
    if (!file?.id || !file.name) {
      return {
        name: "Google Drive Document",
        domain: "Operations Intelligence",
        evidenceType: "Other",
        source: "Google Workspace",
        metadata: { externalId: record.externalId },
      };
    }
    return mapDriveFileToEvidenceDraft(file);
  },
};
