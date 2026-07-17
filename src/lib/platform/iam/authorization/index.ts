export {
  AuthorizationEngine,
  PermissionDeniedError,
  authorize,
  hasPermission,
  requirePermission,
  buildIamAuthzSnapshot,
  toIamAuthzSnapshot,
  type AuthorizationEngineDependencies,
} from "@/lib/platform/iam/authorization/engine";
