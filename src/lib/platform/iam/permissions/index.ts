export {
  IAM_CORE_PERMISSIONS,
  PermissionRegistry,
} from "@/lib/platform/iam/permissions/registry";
export {
  IAM_CORE_PERMISSION_GROUPS,
  PermissionGroupRegistry,
} from "@/lib/platform/iam/permissions/groups";
export {
  expandPermissionKeys,
  expandPermissionGroups,
  resolveEffectivePermissions,
} from "@/lib/platform/iam/permissions/inheritance";
