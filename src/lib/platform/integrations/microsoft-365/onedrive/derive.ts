import { createHash } from "crypto";
import type {
  Microsoft365CanonicalEntity,
  Microsoft365ObjectType,
} from "@/lib/platform/integrations/connectors/microsoft-365/entities";

function digestId(kind: string, key: string): string {
  const hash = createHash("sha1").update(`${kind}:${key}`).digest("hex").slice(0, 16);
  return `jag_${kind}_${hash}`;
}

export function deriveOneDriveCanonicalEntities(
  records: readonly Microsoft365CanonicalEntity[]
): Microsoft365CanonicalEntity[] {
  const derived: Microsoft365CanonicalEntity[] = [];

  const enriched = records.map((record) => {
    if (record.objectType === "onedrive_folder") {
      return {
        ...record,
        attributes: { ...record.attributes, kind: "Folder" },
      };
    }
    if (record.objectType === "onedrive_file") {
      return {
        ...record,
        attributes: { ...record.attributes, kind: "Document" },
      };
    }
    return record;
  });

  for (const record of enriched) {
    if (record.objectType !== "onedrive_file") continue;
    const ownerEmail =
      typeof record.attributes.ownerEmail === "string"
        ? record.attributes.ownerEmail
        : null;
    if (!ownerEmail) continue;
    derived.push({
      id: digestId("owner", `${record.externalId}:${ownerEmail}`),
      externalId: `owner:${record.externalId}:${ownerEmail}`,
      organizationId: record.organizationId,
      sourceSystem: "microsoft-365",
      syncedAt: record.syncedAt,
      version: 1,
      tenantDomain: record.tenantDomain,
      userId: null,
      objectType: "contact" as Microsoft365ObjectType,
      canonicalType: "person.owner",
      attributes: {
        kind: "Owner",
        email: ownerEmail,
        documentId: record.externalId,
        name: ownerEmail,
      },
    });
  }

  return [...enriched, ...derived];
}
