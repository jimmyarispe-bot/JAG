import type { PermissionModel } from "@/jag/modeling";
import {
  WORK_PERMISSION_KEYS,
  WORK_PERMISSION_PACK_ID,
} from "@/packages/work/permissions/keys";

export const WORK_PERMISSION_PACK: PermissionModel = Object.freeze({
  id: WORK_PERMISSION_PACK_ID,
  label: "Work core permissions",
  description:
    "Permission key catalog for Universal Work (effort; BPM/PM/payroll remain separate).",
  permissions: Object.freeze(Object.values(WORK_PERMISSION_KEYS)),
});

export const WORK_PERMISSION_PACKS: readonly PermissionModel[] = Object.freeze([
  WORK_PERMISSION_PACK,
]);
