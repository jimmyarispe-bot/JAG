import { contentHash, newId, nowIso } from "../ids";
import { kstore } from "../store";
import type { StorageObject } from "../types";

export function putObject(input: {
  organizationId: string;
  content: string;
  mimeType: string;
}): StorageObject {
  const key = `obj:${input.organizationId}:${contentHash(input.content).slice(0, 16)}:${newId("s").slice(-8)}`;
  return kstore.upsertStorage({
    key,
    organizationId: input.organizationId,
    content: input.content,
    mimeType: input.mimeType,
    byteSize: Buffer.byteLength(input.content, "utf8"),
    createdAt: nowIso(),
  });
}

export function getObject(key: string): StorageObject | null {
  return kstore.getStorage(key);
}
