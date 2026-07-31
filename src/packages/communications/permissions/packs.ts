import type { PermissionModel } from "@/jag/modeling";
import {
  COMMUNICATIONS_PERMISSION_KEYS,
  COMMUNICATIONS_PERMISSION_PACK_ID,
} from "@/packages/communications/permissions/keys";

export const COMMUNICATIONS_PERMISSION_PACK: PermissionModel = Object.freeze({
  id: COMMUNICATIONS_PERMISSION_PACK_ID,
  label: "Communications core permissions",
  description:
    "Permission key catalog for Universal Communications (intent; transport is integration).",
  permissions: Object.freeze(Object.values(COMMUNICATIONS_PERMISSION_KEYS)),
});

export const COMMUNICATIONS_PERMISSION_PACKS: readonly PermissionModel[] =
  Object.freeze([COMMUNICATIONS_PERMISSION_PACK]);
