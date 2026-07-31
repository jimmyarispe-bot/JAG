import type { PermissionModel } from "@/jag/modeling";
import {
  IDENTITY_PERMISSION_KEYS,
  IDENTITY_PERMISSION_PACK_ID,
} from "@/packages/identity/permissions/keys";

export const IDENTITY_PERMISSION_PACK: PermissionModel = Object.freeze({
  id: IDENTITY_PERMISSION_PACK_ID,
  label: "Identity core permissions",
  description:
    "Permission key catalog for Universal Organizational Identity (bindings represented; authz executed by JAG).",
  permissions: Object.freeze(Object.values(IDENTITY_PERMISSION_KEYS)),
});

export const IDENTITY_PERMISSION_PACKS: readonly PermissionModel[] =
  Object.freeze([IDENTITY_PERMISSION_PACK]);
