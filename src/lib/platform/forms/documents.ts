import { EntityService } from "@/lib/platform/entities";
import type { FormValues } from "@/lib/platform/forms/types";

/**
 * Attach document_upload field values to an entity.
 * Values may be string storage refs or { title, storageRef, mimeType }.
 */
export function attachFormDocuments(input: {
  entityType: string;
  entityId: string;
  organizationId?: string | null;
  values: FormValues;
  fieldKeys: string[];
  actorUserId?: string | null;
  now?: string;
}): string[] {
  const documentIds: string[] = [];
  const now = input.now ?? new Date().toISOString();

  for (const key of input.fieldKeys) {
    const raw = input.values[key];
    if (raw == null || raw === "") continue;

    const items = Array.isArray(raw) ? raw : [raw];
    for (const item of items) {
      let title = key;
      let storageRef: string | null = null;
      let mimeType: string | null = null;

      if (typeof item === "string") {
        storageRef = item;
        title = key;
      } else if (item && typeof item === "object") {
        const obj = item as Record<string, unknown>;
        title = String(obj.title ?? key);
        storageRef = (obj.storageRef as string | null) ?? null;
        mimeType = (obj.mimeType as string | null) ?? null;
      } else {
        continue;
      }

      const doc = EntityService.attachDocument({
        entityType: input.entityType,
        entityId: input.entityId,
        title,
        organizationId: input.organizationId,
        storageRef,
        mimeType,
        ownerUserId: input.actorUserId ?? null,
        now,
        metadata: { formField: key },
      });
      documentIds.push(doc.id);
    }
  }

  return documentIds;
}
