/**
 * In-memory enterprise admin store — CI / dry-run safe.
 * Never talks to IdP vendors or mints live cloud licenses.
 */

import type {
  AbacPolicy,
  ApiKeyRecord,
  AuditEvent,
  ComplianceControl,
  DelegationGrant,
  LicenseRecord,
  OrganizationRecord,
  SamlProviderConfig,
  ScimConfig,
  SecurityFinding,
  SsoProviderConfig,
  TenantProvisionJob,
  UsageMetric,
} from "@/lib/platform/enterprise/types";

type OrgBucket = {
  sso: SsoProviderConfig[];
  saml: SamlProviderConfig[];
  scim: ScimConfig | null;
  abac: AbacPolicy[];
  delegations: DelegationGrant[];
  audit: AuditEvent[];
  compliance: ComplianceControl[];
  security: SecurityFinding[];
  apiKeys: ApiKeyRecord[];
  organization: OrganizationRecord | null;
  license: LicenseRecord | null;
  usage: UsageMetric[];
  provisionJobs: TenantProvisionJob[];
};

function emptyBucket(): OrgBucket {
  return {
    sso: [],
    saml: [],
    scim: null,
    abac: [],
    delegations: [],
    audit: [],
    compliance: [],
    security: [],
    apiKeys: [],
    organization: null,
    license: null,
    usage: [],
    provisionJobs: [],
  };
}

class EnterpriseAdminStore {
  private readonly byOrg = new Map<string, OrgBucket>();

  private bucket(organizationId: string): OrgBucket {
    let b = this.byOrg.get(organizationId);
    if (!b) {
      b = emptyBucket();
      this.byOrg.set(organizationId, b);
    }
    return b;
  }

  get(organizationId: string): OrgBucket {
    return this.bucket(organizationId);
  }

  ensureOrganization(org: OrganizationRecord): OrganizationRecord {
    const b = this.bucket(org.id);
    b.organization = org;
    return org;
  }

  upsertSso(config: SsoProviderConfig) {
    const b = this.bucket(config.organizationId);
    const idx = b.sso.findIndex((s) => s.id === config.id || s.key === config.key);
    if (idx >= 0) b.sso[idx] = config;
    else b.sso.push(config);
    return config;
  }

  upsertSaml(config: SamlProviderConfig) {
    const b = this.bucket(config.organizationId);
    const idx = b.saml.findIndex((s) => s.id === config.id || s.key === config.key);
    if (idx >= 0) b.saml[idx] = config;
    else b.saml.push(config);
    return config;
  }

  setScim(config: ScimConfig) {
    this.bucket(config.organizationId).scim = config;
    return config;
  }

  upsertAbac(policy: AbacPolicy) {
    const b = this.bucket(policy.organizationId);
    const idx = b.abac.findIndex((p) => p.id === policy.id);
    if (idx >= 0) b.abac[idx] = policy;
    else b.abac.push(policy);
    return policy;
  }

  addDelegation(grant: DelegationGrant) {
    this.bucket(grant.organizationId).delegations.push(grant);
    return grant;
  }

  appendAudit(event: AuditEvent) {
    const b = this.bucket(event.organizationId);
    b.audit.unshift(event);
    if (b.audit.length > 500) b.audit.length = 500;
    return event;
  }

  setCompliance(organizationId: string, controls: ComplianceControl[]) {
    this.bucket(organizationId).compliance = controls;
  }

  addSecurityFinding(finding: SecurityFinding) {
    this.bucket(finding.organizationId).security.push(finding);
    return finding;
  }

  addApiKey(key: ApiKeyRecord) {
    this.bucket(key.organizationId).apiKeys.push(key);
    return key;
  }

  revokeApiKey(organizationId: string, keyId: string, at: string) {
    const key = this.bucket(organizationId).apiKeys.find((k) => k.id === keyId);
    if (!key) return null;
    key.revokedAt = at;
    return key;
  }

  setLicense(license: LicenseRecord) {
    this.bucket(license.organizationId).license = license;
    return license;
  }

  setUsage(organizationId: string, metrics: UsageMetric[]) {
    this.bucket(organizationId).usage = metrics;
  }

  addProvisionJob(job: TenantProvisionJob) {
    this.bucket(job.organizationId).provisionJobs.unshift(job);
    return job;
  }

  clear(organizationId?: string) {
    if (!organizationId) {
      this.byOrg.clear();
      return;
    }
    this.byOrg.delete(organizationId);
  }
}

export const enterpriseAdminStore = new EnterpriseAdminStore();
