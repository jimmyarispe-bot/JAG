import { createHash, randomBytes } from "crypto";
import type { OrganizationPlatformStore } from "../store";
import {
  assertPermission,
  assertSameOrganization,
  type ActorContext,
} from "../rbac";
import type {
  OrganizationApiCredential,
  OrganizationSecret,
  OrganizationSettings,
} from "../types";

function now(): string {
  return new Date().toISOString();
}

function fingerprint(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

export class SettingsService {
  constructor(private readonly store: OrganizationPlatformStore) {}

  get(organizationId: string, actor: ActorContext): OrganizationSettings {
    assertPermission(actor, "org.read");
    assertSameOrganization(organizationId, actor.organizationId, "organization");
    const settings = this.store.settings.get(organizationId);
    if (!settings) throw new Error(`Settings not found for ${organizationId}`);
    return settings;
  }

  update(
    organizationId: string,
    patch: Partial<
      Omit<OrganizationSettings, "organizationId" | "updatedAt" | "branding" | "companyProfile">
    > & {
      companyProfile?: Partial<OrganizationSettings["companyProfile"]>;
      branding?: Partial<OrganizationSettings["branding"]>;
    },
    actor: ActorContext
  ): OrganizationSettings {
    const needsBranding = Boolean(patch.branding);
    assertPermission(actor, needsBranding ? "org.branding" : "org.settings");
    assertSameOrganization(organizationId, actor.organizationId, "organization");
    const current = this.store.settings.get(organizationId);
    if (!current) throw new Error(`Settings not found for ${organizationId}`);
    const next: OrganizationSettings = {
      ...current,
      ...patch,
      companyProfile: {
        ...current.companyProfile,
        ...patch.companyProfile,
      },
      branding: {
        ...current.branding,
        ...patch.branding,
      },
      updatedAt: now(),
    };
    this.store.settings.set(organizationId, next);
    this.store.appendAudit({
      organizationId,
      actorUserId: actor.userId,
      action: "settings.updated",
      detail: { keys: Object.keys(patch) },
    });
    return next;
  }
}

export class SecretsService {
  constructor(private readonly store: OrganizationPlatformStore) {}

  put(
    organizationId: string,
    key: string,
    value: string,
    actor: ActorContext
  ): OrganizationSecret {
    assertPermission(actor, "secrets.manage");
    assertSameOrganization(organizationId, actor.organizationId, "organization");
    const existing = [...this.store.secrets.values()].find(
      (s) => s.organizationId === organizationId && s.key === key
    );
    const id = existing?.id ?? this.store.createId("sec");
    const record: OrganizationSecret = {
      id,
      organizationId,
      key,
      fingerprint: fingerprint(value),
      createdAt: existing?.createdAt ?? now(),
      updatedAt: now(),
    };
    this.store.secrets.set(id, record);
    this.store.secretValues.set(id, value);
    this.store.appendAudit({
      organizationId,
      actorUserId: actor.userId,
      action: "secret.upserted",
      detail: { key, fingerprint: record.fingerprint },
    });
    return record;
  }

  /** Returns plaintext only for same-org actors with secrets.manage. */
  getValue(organizationId: string, key: string, actor: ActorContext): string {
    assertPermission(actor, "secrets.manage");
    assertSameOrganization(organizationId, actor.organizationId, "organization");
    const secret = [...this.store.secrets.values()].find(
      (s) => s.organizationId === organizationId && s.key === key
    );
    if (!secret) throw new Error(`Secret not found: ${key}`);
    const value = this.store.secretValues.get(secret.id);
    if (value === undefined) throw new Error("Secret value missing");
    return value;
  }

  list(organizationId: string, actor: ActorContext): OrganizationSecret[] {
    assertPermission(actor, "secrets.manage");
    assertSameOrganization(organizationId, actor.organizationId, "organization");
    return [...this.store.secrets.values()].filter((s) => s.organizationId === organizationId);
  }
}

export class ApiCredentialService {
  constructor(private readonly store: OrganizationPlatformStore) {}

  create(
    organizationId: string,
    name: string,
    actor: ActorContext
  ): { credential: OrganizationApiCredential; rawToken: string } {
    assertPermission(actor, "secrets.manage");
    assertSameOrganization(organizationId, actor.organizationId, "organization");
    const rawToken = `jag_${randomBytes(24).toString("hex")}`;
    const prefix = rawToken.slice(0, 10);
    const credential: OrganizationApiCredential = {
      id: this.store.createId("apicred"),
      organizationId,
      name,
      prefix,
      fingerprint: fingerprint(rawToken),
      createdAt: now(),
      lastUsedAt: null,
      revokedAt: null,
    };
    this.store.apiCredentials.set(credential.id, credential);
    this.store.apiCredentialValues.set(credential.id, rawToken);
    this.store.appendAudit({
      organizationId,
      actorUserId: actor.userId,
      action: "api_credential.created",
      detail: { name, prefix },
    });
    return { credential, rawToken };
  }

  list(organizationId: string, actor: ActorContext): OrganizationApiCredential[] {
    assertPermission(actor, "secrets.manage");
    assertSameOrganization(organizationId, actor.organizationId, "organization");
    return [...this.store.apiCredentials.values()].filter(
      (c) => c.organizationId === organizationId && !c.revokedAt
    );
  }

  revoke(credentialId: string, actor: ActorContext): void {
    assertPermission(actor, "secrets.manage");
    const cred = this.store.apiCredentials.get(credentialId);
    if (!cred) throw new Error("Credential not found");
    assertSameOrganization(cred.organizationId, actor.organizationId, "credential");
    this.store.apiCredentials.set(credentialId, {
      ...cred,
      revokedAt: now(),
    });
    this.store.apiCredentialValues.delete(credentialId);
  }
}
