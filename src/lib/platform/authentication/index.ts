/** JAG Authentication Service — provider-agnostic platform auth (Sprint 060C). */

export type { AuthenticationProvider } from "@/lib/platform/authentication/provider";

export type {
  AuthProviderId,
  AuthResult,
  AuthSession,
  AuthUser,
  AuthUserMetadata,
  CreateAuthUserInput,
  GenerateLinkOptions,
  GenerateLinkResult,
  MfaEnrollResult,
  MfaFactor,
  SignInWithPasswordInput,
  UpdateAuthUserInput,
} from "@/lib/platform/authentication/types";

/** Browser-safe: Client Components should prefer `@/lib/platform/authentication/browser`. */
export {
  AuthenticationService,
  getBrowserAuthenticationService,
} from "@/lib/platform/authentication/browser";

export {
  getAdminAuthenticationService,
  getCookieBoundAuthenticationService,
  getServerAuthenticationService,
} from "@/lib/platform/authentication/service";

export {
  getPlatformAuthContext,
  getPlatformAuthUser,
  type PlatformAuthContext,
} from "@/lib/platform/authentication/session";

export {
  authUserDisplayName,
  authUserMustResetPassword,
  authUserNeedsInviteActivation,
} from "@/lib/platform/authentication/user";

export {
  getLegacyUserFromAuthClient,
  getUserFromAuthClient,
  toLegacySupabaseUser,
} from "@/lib/platform/authentication/supabase-provider";

export {
  buildAuthzSnapshot,
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  loadUserRoleRows,
  requirePermission,
} from "@/lib/platform/authentication/permissions";
