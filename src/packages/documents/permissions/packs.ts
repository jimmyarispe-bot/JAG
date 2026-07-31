import type { PermissionModel } from "@/jag/modeling";
import {
  DOCUMENTS_PERMISSION_KEYS,
  DOCUMENTS_PERMISSION_PACK_ID,
} from "@/packages/documents/permissions/keys";

export const DOCUMENTS_PERMISSION_PACK: PermissionModel = Object.freeze({
  id: DOCUMENTS_PERMISSION_PACK_ID,
  label: "Documents core permissions",
  description:
    "Permission key catalog for Universal Documents (business documents; storage is infrastructure).",
  permissions: Object.freeze(Object.values(DOCUMENTS_PERMISSION_KEYS)),
});

export const DOCUMENTS_PERMISSION_PACKS: readonly PermissionModel[] =
  Object.freeze([DOCUMENTS_PERMISSION_PACK]);
