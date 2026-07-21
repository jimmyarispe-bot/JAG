import type { Microsoft365CanonicalEntity } from "@/lib/platform/integrations/connectors/microsoft-365/entities";

export function deriveSharePointCanonicalEntities(
  records: readonly Microsoft365CanonicalEntity[]
): Microsoft365CanonicalEntity[] {
  return records.map((record) => {
    if (record.objectType === "sharepoint_file") {
      return {
        ...record,
        attributes: { ...record.attributes, kind: "Document" },
      };
    }
    if (record.objectType === "sharepoint_site") {
      return {
        ...record,
        attributes: { ...record.attributes, kind: "Folder" },
      };
    }
    return record;
  });
}
