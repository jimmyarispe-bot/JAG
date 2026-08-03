import type { AuthenticationProvider } from "@/lib/platform/authentication/provider";
import type {
  AuthSession,
  AuthUser,
  AuthUserMetadata,
  CreateAuthUserInput,
  GenerateLinkOptions,
  SignInWithPasswordInput,
  UpdateAuthUserInput,
} from "@/lib/platform/authentication/types";

/**
 * Platform AuthenticationService — applications call this, never supabase.auth.
 * Class only — no provider factory imports (safe for browser entrypoints).
 */
export class AuthenticationService {
  constructor(private readonly provider: AuthenticationProvider) {}

  get providerId() {
    return this.provider.id;
  }

  signInWithPassword(input: SignInWithPasswordInput) {
    return this.provider.signInWithPassword(input);
  }

  signOut() {
    return this.provider.signOut();
  }

  refreshSession() {
    return this.provider.refreshSession();
  }

  getCurrentUser(): Promise<AuthUser | null> {
    return this.provider.getCurrentUser();
  }

  getCurrentSession(): Promise<AuthSession | null> {
    return this.provider.getCurrentSession();
  }

  updatePassword(password: string, metadata?: AuthUserMetadata) {
    return this.provider.updatePassword(password, metadata);
  }

  updateUser(input: UpdateAuthUserInput) {
    return this.provider.updateUser(input);
  }

  verifyInvite(tokenHash: string) {
    return this.provider.verifyInvite(tokenHash);
  }

  verifyRecovery(tokenHash: string) {
    return this.provider.verifyRecovery(tokenHash);
  }

  verifyEmailToken(type: string, tokenHash: string) {
    return this.provider.verifyEmailToken(type, tokenHash);
  }

  exchangeCodeForSession(code: string) {
    return this.provider.exchangeCodeForSession(code);
  }

  generateInvite(email: string, options?: GenerateLinkOptions) {
    return this.provider.generateInvite(email, options);
  }

  generateRecovery(email: string, options?: GenerateLinkOptions) {
    return this.provider.generateRecovery(email, options);
  }

  generateMagicLink(email: string, options?: GenerateLinkOptions) {
    return this.provider.generateMagicLink(email, options);
  }

  createUser(input: CreateAuthUserInput) {
    return this.provider.createUser(input);
  }

  deleteUser(userId: string) {
    return this.provider.deleteUser(userId);
  }

  updateMetadata(userId: string, metadata: AuthUserMetadata) {
    return this.provider.updateMetadata(userId, metadata);
  }

  setUserBanned(
    userId: string,
    banned: boolean,
    metadata?: AuthUserMetadata
  ) {
    return this.provider.setUserBanned(userId, banned, metadata);
  }

  getUserById(userId: string) {
    return this.provider.getUserById(userId);
  }

  mfaGetAssuranceLevel() {
    return this.provider.mfaGetAssuranceLevel();
  }

  mfaListFactors() {
    return this.provider.mfaListFactors();
  }

  mfaEnrollTotp(friendlyName: string) {
    return this.provider.mfaEnrollTotp(friendlyName);
  }

  mfaUnenroll(factorId: string) {
    return this.provider.mfaUnenroll(factorId);
  }

  mfaChallengeAndVerify(factorId: string, code: string) {
    return this.provider.mfaChallengeAndVerify(factorId, code);
  }
}
