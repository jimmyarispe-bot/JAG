import { newId, nowIso } from "../ids";
import { kstore } from "../store";
import type { KnowledgeFolder } from "../types";

export function createFolder(input: {
  organizationId: string;
  userId: string;
  name: string;
  parentFolderId?: string | null;
}): KnowledgeFolder {
  const parent = input.parentFolderId
    ? kstore.getFolder(input.parentFolderId)
    : null;
  if (input.parentFolderId && !parent) throw new Error("parent folder not found");
  const name = input.name.trim();
  if (!name) throw new Error("folder name required");
  const path = parent ? `${parent.path}/${name}` : `/${name}`;
  return kstore.upsertFolder({
    id: newId("kfold"),
    organizationId: input.organizationId,
    parentFolderId: parent?.id ?? null,
    name,
    path,
    createdAt: nowIso(),
    createdBy: input.userId,
  });
}

export function listFolders(organizationId: string) {
  return kstore.listFolders(organizationId);
}
