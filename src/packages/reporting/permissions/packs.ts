import type { PermissionModel } from "@/jag/modeling";
import {
  REPORTING_PERMISSION_KEYS,
  REPORTING_PERMISSION_PACK_ID,
} from "@/packages/reporting/permissions/keys";

export const REPORTING_PERMISSION_PACK: PermissionModel = Object.freeze({
  id: REPORTING_PERMISSION_PACK_ID,
  label: "Reporting core permissions",
  description:
    "Permission key catalog for Universal Reporting (definitions; analytics/query/render remain separate).",
  permissions: Object.freeze(Object.values(REPORTING_PERMISSION_KEYS)),
});

export const REPORTING_PERMISSION_PACKS: readonly PermissionModel[] =
  Object.freeze([REPORTING_PERMISSION_PACK]);
