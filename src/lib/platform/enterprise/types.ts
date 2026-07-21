/**
 * RC-9 — Enterprise Administration types.
 * Soft-reads IAM catalogs where available; mutations are in-memory / intent-only for CI.
 */

import type {
  CenterCard,
  CenterControl,
  CenterPanelShell,
} from "@/lib/platform/types";

export const ENTERPRISE_ADMIN_VERSION = "1.0.0";

export const ENTERPRISE_CENTERS = [
  "sso",
  "saml",
  "scim",
  "rbac",
  "abac",
  "delegated_administration",
  "audit_center",
  "compliance_center",
  "security_center",
  "api_keys",
  "organization_management",
  "license_management",
  "usage_analytics",
  "tenant_provisioning",
] as const;

export type EnterpriseCenterId = (typeof ENTERPRISE_CENTERS)[number];

export type EnterpriseCenterCard = CenterCard;

export type EnterpriseCenter = CenterPanelShell & {
  id: EnterpriseCenterId;
  status: "ready" | "configured" | "partial" | "not_configured";
  cards: CenterCard[];
  controls: CenterControl[];
};

export type EnterpriseAdminWorkspace = {
  version: string;
  organizationId: string;
  generatedAt: string;
  centers: Record<EnterpriseCenterId, EnterpriseCenter>;
  centerOrder: EnterpriseCenterId[];
  healthScore: { value: number; label: string };
  summary: string;
  contributingDomains: string[];
  governance: {
    mayAutoExecute: false;
    vendorIdpRequiredForLiveSso: true;
    mutationsAreIntentOnlyUnlessLiveAdapter: true;
  };
};

/** SSO / OIDC provider config (stored in-memory for CI). */
export type SsoProviderConfig = {
  id: string;
  organizationId: string;
  key: string;
  name: string;
  protocol: "oidc" | "oauth2";
  issuer?: string;
  clientId?: string;
  enabled: boolean;
  roleMapping: Record<string, string>;
  createdAt: string;
};

/** SAML IdP config. */
export type SamlProviderConfig = {
  id: string;
  organizationId: string;
  key: string;
  name: string;
  entityId?: string;
  ssoUrl?: string;
  certificateFingerprint?: string;
  enabled: boolean;
  attributeMapping: Record<string, string>;
  createdAt: string;
};

/** SCIM directory sync config. */
export type ScimConfig = {
  id: string;
  organizationId: string;
  endpoint?: string;
  bearerTokenHint?: string;
  enabled: boolean;
  syncUsers: boolean;
  syncGroups: boolean;
  lastSyncAt?: string;
  createdAt: string;
};

export type RbacRole = {
  key: string;
  displayName: string;
  permissions: string[];
  kind: "system" | "organization" | "custom";
};

export type AbacPolicy = {
  id: string;
  organizationId: string;
  name: string;
  effect: "allow" | "deny";
  actions: string[];
  resource: string;
  /** Attribute conditions: subject.dept == Finance */
  conditions: Array<{
    attribute: string;
    operator: "equals" | "not_equals" | "in" | "contains";
    value: unknown;
  }>;
  enabled: boolean;
};

export type DelegationGrant = {
  id: string;
  organizationId: string;
  fromUserId: string;
  toUserId: string;
  scope: string;
  permissions: string[];
  expiresAt?: string;
  active: boolean;
  createdAt: string;
};

export type AuditEvent = {
  id: string;
  organizationId: string;
  at: string;
  actorUserId?: string;
  action: string;
  resource: string;
  outcome: "success" | "denied" | "error" | "intent";
  details?: Record<string, unknown>;
};

export type ComplianceControl = {
  id: string;
  key: string;
  name: string;
  framework: string;
  status: "pass" | "fail" | "partial" | "not_assessed";
  evidence?: string;
};

export type SecurityFinding = {
  id: string;
  organizationId: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  summary: string;
  status: "open" | "acknowledged" | "resolved";
  createdAt: string;
};

export type ApiKeyRecord = {
  id: string;
  organizationId: string;
  name: string;
  prefix: string;
  /** Hashed secret — never store raw key after creation. */
  secretHash: string;
  scopes: string[];
  createdAt: string;
  revokedAt?: string;
  lastUsedAt?: string;
};

export type OrganizationRecord = {
  id: string;
  slug: string;
  name: string;
  status: "draft" | "active" | "suspended" | "archived";
  ownerUserId?: string;
  createdAt: string;
  updatedAt: string;
  settings: Record<string, unknown>;
};

export type LicenseRecord = {
  id: string;
  organizationId: string;
  plan: string;
  seats: number;
  seatsUsed: number;
  status: "trial" | "active" | "expired" | "suspended";
  startsAt: string;
  endsAt?: string;
};

export type UsageMetric = {
  key: string;
  label: string;
  value: number;
  unit: string;
  period: string;
};

export type TenantProvisionJob = {
  id: string;
  organizationId: string;
  tenantSlug: string;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  dryRun: boolean;
  createdAt: string;
  finishedAt?: string;
  steps: string[];
  error?: string;
};

export type AuthzDecision = {
  allowed: boolean;
  reason: string;
  matchedPolicies: string[];
  engine: "rbac" | "abac" | "rbac+abac";
};
