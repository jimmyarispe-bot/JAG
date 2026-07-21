/**
 * Authentication strategy contracts for the Integration Platform Core.
 */

import type { AuthContext, AuthSession, AuthStrategy } from "@/lib/platform/integrations/types";

export interface AuthAdapter {
  readonly strategy: AuthStrategy;
  authenticate(context: AuthContext): Promise<AuthSession>;
  refresh?(context: AuthContext): Promise<AuthSession>;
  revoke?(context: AuthContext): Promise<void>;
  validate?(context: AuthContext): Promise<{ ok: boolean; issues: string[] }>;
}

export interface AuthFramework {
  registerAdapter(adapter: AuthAdapter): void;
  getAdapter(strategy: AuthStrategy): AuthAdapter | null;
  authenticate(context: AuthContext): Promise<AuthSession>;
  refresh(context: AuthContext): Promise<AuthSession>;
  disconnect(context: AuthContext): Promise<void>;
}
