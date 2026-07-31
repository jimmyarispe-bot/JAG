/**
 * Browser-safe authentication entry — never imports next/headers or server-auth.
 * Client Components must import from this module (not the authentication barrel).
 */

import { AuthenticationService } from "@/lib/platform/authentication/authentication-service";
import { createBrowserAuthenticationProvider } from "@/lib/platform/authentication/supabase-provider";

export { AuthenticationService } from "@/lib/platform/authentication/authentication-service";
export {
  authUserDisplayName,
  authUserMustResetPassword,
  authUserNeedsInviteActivation,
} from "@/lib/platform/authentication/user";

let browserService: AuthenticationService | null = null;

/** Client Components — browser cookie session. */
export function getBrowserAuthenticationService(): AuthenticationService {
  if (!browserService) {
    browserService = new AuthenticationService(
      createBrowserAuthenticationProvider()
    );
  }
  return browserService;
}
