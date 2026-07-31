import type {
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

/**
 * Provider contract — Supabase is one implementation.
 * Future: Azure AD, Auth0, Cognito, Google Identity implement the same surface.
 */
export interface AuthenticationProvider {
  readonly id: AuthProviderId;

  signInWithPassword(
    input: SignInWithPasswordInput
  ): Promise<AuthResult<{ user: AuthUser; session: AuthSession | null }>>;

  signOut(): Promise<AuthResult<null>>;

  refreshSession(): Promise<AuthResult<{ user: AuthUser; session: AuthSession | null }>>;

  getCurrentUser(): Promise<AuthUser | null>;

  getCurrentSession(): Promise<AuthSession | null>;

  updatePassword(
    password: string,
    metadata?: AuthUserMetadata
  ): Promise<AuthResult<AuthUser>>;

  updateUser(input: UpdateAuthUserInput): Promise<AuthResult<AuthUser>>;

  verifyInvite(tokenHash: string): Promise<AuthResult<{ user: AuthUser }>>;

  verifyRecovery(tokenHash: string): Promise<AuthResult<{ user: AuthUser }>>;

  /** Generic email OTP (invite, recovery, magiclink, signup, email, …). */
  verifyEmailToken(
    type: string,
    tokenHash: string
  ): Promise<AuthResult<{ user: AuthUser }>>;

  exchangeCodeForSession(code: string): Promise<AuthResult<{ user: AuthUser }>>;

  /** Admin: invite token (no email send). */
  generateInvite(
    email: string,
    options?: GenerateLinkOptions
  ): Promise<AuthResult<GenerateLinkResult>>;

  /** Admin: recovery token (no email send). */
  generateRecovery(
    email: string,
    options?: GenerateLinkOptions
  ): Promise<AuthResult<GenerateLinkResult>>;

  createUser(input: CreateAuthUserInput): Promise<AuthResult<AuthUser>>;

  deleteUser(userId: string): Promise<AuthResult<null>>;

  updateMetadata(
    userId: string,
    metadata: AuthUserMetadata
  ): Promise<AuthResult<AuthUser>>;

  /** Ban (`banned=true`) or clear ban (`banned=false`). */
  setUserBanned(
    userId: string,
    banned: boolean,
    metadata?: AuthUserMetadata
  ): Promise<AuthResult<AuthUser>>;

  getUserById(userId: string): Promise<AuthResult<AuthUser | null>>;

  /** MFA (optional for non-TOTP providers — may return not supported). */
  mfaGetAssuranceLevel(): Promise<
    AuthResult<{ currentLevel: string | null; nextLevel: string | null }>
  >;
  mfaListFactors(): Promise<
    AuthResult<{ totp: MfaFactor[]; all: MfaFactor[] }>
  >;
  mfaEnrollTotp(friendlyName: string): Promise<AuthResult<MfaEnrollResult>>;
  mfaUnenroll(factorId: string): Promise<AuthResult<null>>;
  mfaChallengeAndVerify(
    factorId: string,
    code: string
  ): Promise<AuthResult<null>>;
}
