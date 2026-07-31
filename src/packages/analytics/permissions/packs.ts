import type { PermissionModel } from "@/jag/modeling";
import {
  ANALYTICS_PERMISSION_KEYS,
  ANALYTICS_PERMISSION_PACK_ID,
} from "@/packages/analytics/permissions/keys";

export const ANALYTICS_PERMISSION_PACK: PermissionModel = Object.freeze({
  id: ANALYTICS_PERMISSION_PACK_ID,
  label: "Analytics core permissions",
  description:
    "Permission key catalog for Universal Analytics (interpretative definitions; query/ML/dashboards remain separate).",
  permissions: Object.freeze(Object.values(ANALYTICS_PERMISSION_KEYS)),
});

export const ANALYTICS_PERMISSION_PACKS: readonly PermissionModel[] =
  Object.freeze([ANALYTICS_PERMISSION_PACK]);
