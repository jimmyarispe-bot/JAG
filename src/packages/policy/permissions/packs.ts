import type { PermissionModel } from "@/jag/modeling";
import {
  POLICY_PERMISSION_KEYS,
  POLICY_PERMISSION_PACK_ID,
} from "@/packages/policy/permissions/keys";

export const POLICY_PERMISSION_PACK: PermissionModel = Object.freeze({
  id: POLICY_PERMISSION_PACK_ID,
  label: "Policy core permissions",
  description:
    "Permission key catalog for Universal Policy (governance representations; rule/auth engines remain separate).",
  permissions: Object.freeze(Object.values(POLICY_PERMISSION_KEYS)),
});

export const POLICY_PERMISSION_PACKS: readonly PermissionModel[] =
  Object.freeze([POLICY_PERMISSION_PACK]);
