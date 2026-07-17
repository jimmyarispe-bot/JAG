/**
 * Authentication provider port — IAM does not bind to a specific IdP.
 */

export type AuthIdentity = {
  subjectId: string;
  email: string;
  emailVerified: boolean;
};

export type AuthenticationPort = {
  /** Resolve the currently authenticated subject, or null if anonymous. */
  getAuthenticatedSubject(): Promise<AuthIdentity | null> | AuthIdentity | null;
};
