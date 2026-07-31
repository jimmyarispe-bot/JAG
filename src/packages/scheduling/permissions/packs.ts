import type { PermissionModel } from "@/jag/modeling";
import {
  SCHEDULING_PERMISSION_KEYS,
  SCHEDULING_PERMISSION_PACK_ID,
} from "@/packages/scheduling/permissions/keys";

export const SCHEDULING_PERMISSION_PACK: PermissionModel = Object.freeze({
  id: SCHEDULING_PERMISSION_PACK_ID,
  label: "Scheduling core permissions",
  description:
    "Permission key catalog for Universal Scheduling (time coordination; calendars/meetings are integrations).",
  permissions: Object.freeze(Object.values(SCHEDULING_PERMISSION_KEYS)),
});

export const SCHEDULING_PERMISSION_PACKS: readonly PermissionModel[] =
  Object.freeze([SCHEDULING_PERMISSION_PACK]);
