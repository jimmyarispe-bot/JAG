import type { AuthSession } from "@/lib/platform/integrations/types";
import type { Microsoft365AuthSession } from "@/lib/platform/integrations/connectors/microsoft-365/auth/oauth";

export type StoredMicrosoft365Session = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  tenantId: string;
  tenantDomain: string;
  consentType: "admin" | "user";
  installedAt: string;
  disconnectedAt?: string | null;
};

export class Microsoft365SessionStore {
  private readonly sessions = new Map<string, StoredMicrosoft365Session>();

  install(instanceId: string, session: Microsoft365AuthSession): StoredMicrosoft365Session {
    const stored: StoredMicrosoft365Session = {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresAt: session.expiresAt,
      tenantId: session.tenantId,
      tenantDomain: session.tenantDomain,
      consentType: session.consentType,
      installedAt: new Date().toISOString(),
      disconnectedAt: null,
    };
    this.sessions.set(instanceId, stored);
    return stored;
  }

  get(instanceId: string): StoredMicrosoft365Session | null {
    return this.sessions.get(instanceId) ?? null;
  }

  refresh(
    instanceId: string,
    tokens: { accessToken: string; refreshToken?: string; expiresAt?: string }
  ): StoredMicrosoft365Session | null {
    const existing = this.sessions.get(instanceId);
    if (!existing) return null;
    const next: StoredMicrosoft365Session = {
      ...existing,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken ?? existing.refreshToken,
      expiresAt: tokens.expiresAt ?? existing.expiresAt,
      disconnectedAt: null,
    };
    this.sessions.set(instanceId, next);
    return next;
  }

  disconnect(instanceId: string): void {
    const existing = this.sessions.get(instanceId);
    if (!existing) {
      this.sessions.delete(instanceId);
      return;
    }
    this.sessions.set(instanceId, {
      ...existing,
      accessToken: "",
      disconnectedAt: new Date().toISOString(),
    });
  }

  toAuthSession(stored: StoredMicrosoft365Session): AuthSession {
    if (!stored.accessToken || stored.disconnectedAt) {
      return { ok: false, strategy: "oauth2", error: "Disconnected" };
    }
    return {
      ok: true,
      strategy: "oauth2",
      accessToken: stored.accessToken,
      refreshToken: stored.refreshToken,
      expiresAt: stored.expiresAt,
      metadata: {
        tenantId: stored.tenantId,
        tenantDomain: stored.tenantDomain,
        consentType: stored.consentType,
      },
    };
  }
}
