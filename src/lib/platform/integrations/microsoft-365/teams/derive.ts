import type { Microsoft365CanonicalEntity } from "@/lib/platform/integrations/connectors/microsoft-365/entities";

export function deriveTeamsCanonicalEntities(
  records: readonly Microsoft365CanonicalEntity[]
): Microsoft365CanonicalEntity[] {
  return records.map((record) => {
    if (record.objectType === "meet") {
      return {
        ...record,
        attributes: { ...record.attributes, kind: "Meeting" },
      };
    }
    if (record.objectType === "chat") {
      return {
        ...record,
        attributes: {
          ...record.attributes,
          kind: "Communication",
          communicationKind: "chat",
        },
      };
    }
    return record;
  });
}
