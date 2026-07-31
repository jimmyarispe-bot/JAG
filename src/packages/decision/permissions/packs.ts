import type { PermissionModel } from "@/jag/modeling";
import {
  DECISION_PERMISSION_KEYS,
  DECISION_PERMISSION_PACK_ID,
} from "@/packages/decision/permissions/keys";

export const DECISION_PERMISSION_PACK: PermissionModel = Object.freeze({
  id: DECISION_PERMISSION_PACK_ID,
  label: "Decision core permissions",
  description:
    "Permission key catalog for Universal Decision (choice; Decision Engine / BPM / AI remain separate).",
  permissions: Object.freeze(Object.values(DECISION_PERMISSION_KEYS)),
});

export const DECISION_PERMISSION_PACKS: readonly PermissionModel[] =
  Object.freeze([DECISION_PERMISSION_PACK]);
