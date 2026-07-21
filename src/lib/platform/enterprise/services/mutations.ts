/**
 * Enterprise admin mutations — in-memory intents only (CI-safe).
 */

import { enterpriseAdminStore } from "@/lib/platform/enterprise/store/enterprise-store";
import type {
  AbacPolicy,
  ApiKeyRecord,
  DelegationGrant,
  LicenseRecord,
  OrganizationRecord,
  SamlProviderConfig,
  ScimConfig,
  SsoProviderConfig,
  TenantProvisionJob,
  UsageMetric,
} from "@/lib/platform/enterprise/types";

function id(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function hashSecret(secret: string): string {
  // Non-cryptographic fingerprint for CI — not for production key storage.
  let h = 0;
  for (let i = 0; i < secret.length; i++) h = (h * 31 + secret.charCodeAt(i)) >>> 0;
  return `h${h.toString(16)}`;
}

function audit(
  organizationId: string,
  action: string,
  resource: string,
  details?: Record<string, unknown>
) {
  enterpriseAdminStore.appendAudit({
    id: id("audit"),
    organizationId,
    at: new Date().toISOString(),
    action,
    resource,
    outcome: "intent",
    details,
  });
}

export function configureSso(
  organizationId: string,
  input: Omit<SsoProviderConfig, "id" | "organizationId" | "createdAt"> & { id?: string }
): SsoProviderConfig {
  const config: SsoProviderConfig = {
    id: input.id ?? id("sso"),
    organizationId,
    key: input.key,
    name: input.name,
    protocol: input.protocol,
    issuer: input.issuer,
    clientId: input.clientId,
    enabled: input.enabled,
    roleMapping: input.roleMapping,
    createdAt: new Date().toISOString(),
  };
  enterpriseAdminStore.upsertSso(config);
  audit(organizationId, "sso.configure", config.key, { enabled: config.enabled });
  return config;
}

export function configureSaml(
  organizationId: string,
  input: Omit<SamlProviderConfig, "id" | "organizationId" | "createdAt"> & { id?: string }
): SamlProviderConfig {
  const config: SamlProviderConfig = {
    id: input.id ?? id("saml"),
    organizationId,
    key: input.key,
    name: input.name,
    entityId: input.entityId,
    ssoUrl: input.ssoUrl,
    certificateFingerprint: input.certificateFingerprint,
    enabled: input.enabled,
    attributeMapping: input.attributeMapping,
    createdAt: new Date().toISOString(),
  };
  enterpriseAdminStore.upsertSaml(config);
  audit(organizationId, "saml.configure", config.key, { enabled: config.enabled });
  return config;
}

export function configureScim(
  organizationId: string,
  input: Omit<ScimConfig, "id" | "organizationId" | "createdAt"> & { id?: string }
): ScimConfig {
  const config: ScimConfig = {
    id: input.id ?? id("scim"),
    organizationId,
    endpoint: input.endpoint,
    bearerTokenHint: input.bearerTokenHint,
    enabled: input.enabled,
    syncUsers: input.syncUsers,
    syncGroups: input.syncGroups,
    lastSyncAt: input.lastSyncAt,
    createdAt: new Date().toISOString(),
  };
  enterpriseAdminStore.setScim(config);
  audit(organizationId, "scim.configure", "scim", { enabled: config.enabled });
  return config;
}

export function runScimSyncDryRun(organizationId: string): {
  ok: boolean;
  usersSynced: number;
  groupsSynced: number;
  message: string;
} {
  const scim = enterpriseAdminStore.get(organizationId).scim;
  if (!scim?.enabled) {
    return { ok: false, usersSynced: 0, groupsSynced: 0, message: "SCIM not enabled" };
  }
  const at = new Date().toISOString();
  enterpriseAdminStore.setScim({ ...scim, lastSyncAt: at });
  audit(organizationId, "scim.sync", "scim", { dryRun: true });
  return {
    ok: true,
    usersSynced: scim.syncUsers ? 12 : 0,
    groupsSynced: scim.syncGroups ? 4 : 0,
    message: "SCIM dry-run sync completed (no external directory call)",
  };
}

export function upsertAbacPolicy(
  organizationId: string,
  policy: Omit<AbacPolicy, "organizationId"> & { organizationId?: string }
): AbacPolicy {
  const full: AbacPolicy = { ...policy, organizationId };
  enterpriseAdminStore.upsertAbac(full);
  audit(organizationId, "abac.upsert", full.id, { effect: full.effect });
  return full;
}

export function grantDelegation(
  organizationId: string,
  input: Omit<DelegationGrant, "id" | "organizationId" | "createdAt" | "active">
): DelegationGrant {
  const grant: DelegationGrant = {
    id: id("dlg"),
    organizationId,
    ...input,
    active: true,
    createdAt: new Date().toISOString(),
  };
  enterpriseAdminStore.addDelegation(grant);
  audit(organizationId, "delegation.grant", grant.id, {
    toUserId: grant.toUserId,
    scope: grant.scope,
  });
  return grant;
}

export function mintApiKey(
  organizationId: string,
  input: { name: string; scopes: string[] }
): { record: ApiKeyRecord; secretOnce: string } {
  const secretOnce = `jag_${id("key")}_${Math.random().toString(36).slice(2, 18)}`;
  const record: ApiKeyRecord = {
    id: id("apikey"),
    organizationId,
    name: input.name,
    prefix: secretOnce.slice(0, 12),
    secretHash: hashSecret(secretOnce),
    scopes: input.scopes,
    createdAt: new Date().toISOString(),
  };
  enterpriseAdminStore.addApiKey(record);
  audit(organizationId, "api_key.mint", record.id, { prefix: record.prefix });
  return { record, secretOnce };
}

export function revokeApiKey(organizationId: string, keyId: string) {
  const at = new Date().toISOString();
  const key = enterpriseAdminStore.revokeApiKey(organizationId, keyId, at);
  if (key) audit(organizationId, "api_key.revoke", keyId);
  return key;
}

export function upsertOrganization(
  org: Omit<OrganizationRecord, "createdAt" | "updatedAt"> & {
    createdAt?: string;
    updatedAt?: string;
  }
): OrganizationRecord {
  const now = new Date().toISOString();
  const record: OrganizationRecord = {
    ...org,
    createdAt: org.createdAt ?? now,
    updatedAt: now,
  };
  enterpriseAdminStore.ensureOrganization(record);
  audit(record.id, "organization.upsert", record.id, { status: record.status });
  return record;
}

export function assignLicense(
  organizationId: string,
  input: Omit<LicenseRecord, "id" | "organizationId"> & { id?: string }
): LicenseRecord {
  const license: LicenseRecord = {
    id: input.id ?? id("lic"),
    organizationId,
    plan: input.plan,
    seats: input.seats,
    seatsUsed: input.seatsUsed,
    status: input.status,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
  };
  enterpriseAdminStore.setLicense(license);
  audit(organizationId, "license.assign", license.id, { plan: license.plan });
  return license;
}

export function recordUsage(organizationId: string, metrics: UsageMetric[]) {
  enterpriseAdminStore.setUsage(organizationId, metrics);
  audit(organizationId, "usage.record", "usage", { count: metrics.length });
}

export function provisionTenant(input: {
  organizationId: string;
  tenantSlug: string;
  dryRun?: boolean;
}): TenantProvisionJob {
  const dryRun = input.dryRun !== false;
  const steps = [
    "validate_slug",
    "create_tenant_shell",
    "seed_rbac_roles",
    "attach_default_license",
    "emit_audit",
  ];
  const job: TenantProvisionJob = {
    id: id("prov"),
    organizationId: input.organizationId,
    tenantSlug: input.tenantSlug,
    status: dryRun ? "completed" : "queued",
    dryRun,
    createdAt: new Date().toISOString(),
    finishedAt: dryRun ? new Date().toISOString() : undefined,
    steps: dryRun ? steps.map((s) => `${s}:ok`) : steps.map((s) => `${s}:queued`),
  };
  if (!dryRun) {
    // Still in-memory — never calls live cloud provisioners from this package.
    job.status = "completed";
    job.finishedAt = new Date().toISOString();
    job.steps = steps.map((s) => `${s}:ok`);
  }
  enterpriseAdminStore.addProvisionJob(job);
  audit(input.organizationId, "tenant.provision", input.tenantSlug, { dryRun, jobId: job.id });
  return job;
}

export function seedDefaultCompliance(organizationId: string) {
  enterpriseAdminStore.setCompliance(organizationId, [
    {
      id: "ctrl-access",
      key: "access_control",
      name: "Access Control",
      framework: "SOC2",
      status: "partial",
      evidence: "RBAC + ABAC engines online",
    },
    {
      id: "ctrl-audit",
      key: "audit_logging",
      name: "Audit Logging",
      framework: "SOC2",
      status: "pass",
      evidence: "Audit Center capturing intents",
    },
    {
      id: "ctrl-encryption",
      key: "encryption_transit",
      name: "Encryption in Transit",
      framework: "SOC2",
      status: "pass",
    },
    {
      id: "ctrl-sso",
      key: "sso_ready",
      name: "SSO Readiness",
      framework: "ISO27001",
      status: "not_assessed",
      evidence: "Configure SSO/SAML providers",
    },
  ]);
}

export function seedDefaultSecurity(organizationId: string) {
  enterpriseAdminStore.addSecurityFinding({
    id: id("sec"),
    organizationId,
    severity: "medium",
    title: "MFA coverage unknown",
    summary: "Enable MFA enforcement once IdP is connected.",
    status: "open",
    createdAt: new Date().toISOString(),
  });
}
