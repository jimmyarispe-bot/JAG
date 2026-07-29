import type {
  IdentityResolutionRequest,
  PrincipalRecord,
} from "./identity-types";

/**
 * Supplies principal identity facts to the Identity Runtime.
 * Does NOT authenticate — the host/auth provider already did that.
 */
export interface IdentityProvider {
  id: string;
  /** Higher priority wins when multiple providers match. */
  priority?: number;
  /**
   * Load the principal for this request.
   * Return null when this provider does not own the session/hint.
   */
  loadPrincipal(
    request: IdentityResolutionRequest
  ): Promise<PrincipalRecord | null> | PrincipalRecord | null;
  /**
   * Load another user's principal facts (impersonation target).
   * Optional — required only when impersonation contracts are used.
   */
  loadPrincipalById?(
    userId: string,
    request: IdentityResolutionRequest
  ): Promise<PrincipalRecord | null> | PrincipalRecord | null;
}

export function sortIdentityProviders(
  providers: readonly IdentityProvider[]
): IdentityProvider[] {
  return [...providers].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
}
