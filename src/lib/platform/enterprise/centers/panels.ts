/**
 * RC-9 Enterprise Administration center projectors.
 */

import { enterpriseAdminStore } from "@/lib/platform/enterprise/store/enterprise-store";
import {
  listEnterprisePermissionCatalog,
  listEnterpriseRbacRoles,
} from "@/lib/platform/enterprise/authz/rbac";
import type {
  EnterpriseCenter,
  EnterpriseCenterId,
} from "@/lib/platform/enterprise/types";

function statusFrom(
  configured: boolean,
  partial?: boolean
): EnterpriseCenter["status"] {
  if (configured) return "configured";
  if (partial) return "partial";
  return "not_configured";
}

export function buildSsoCenter(organizationId: string): EnterpriseCenter {
  const providers = enterpriseAdminStore.get(organizationId).sso;
  const enabled = providers.filter((p) => p.enabled);
  return {
    id: "sso",
    title: "SSO",
    subtitle: "OIDC / OAuth2 identity providers",
    status: statusFrom(enabled.length > 0, providers.length > 0),
    cards: providers.length
      ? providers.map((p) => ({
          id: p.id,
          title: p.name,
          summary: `${p.protocol} · ${p.enabled ? "enabled" : "disabled"} · issuer ${p.issuer ?? "n/a"}`,
          meta: { key: p.key, roleMappingKeys: Object.keys(p.roleMapping).length },
        }))
      : [],
    controls: [
      { id: "configure_oidc", label: "Configure OIDC", enabled: true },
      { id: "test_login", label: "Test login (dry-run)", enabled: enabled.length > 0 },
    ],
    emptyMessage: "No SSO providers configured — add OIDC/OAuth2 IdP.",
  };
}

export function buildSamlCenter(organizationId: string): EnterpriseCenter {
  const providers = enterpriseAdminStore.get(organizationId).saml;
  const enabled = providers.filter((p) => p.enabled);
  return {
    id: "saml",
    title: "SAML",
    subtitle: "SAML 2.0 identity providers",
    status: statusFrom(enabled.length > 0, providers.length > 0),
    cards: providers.map((p) => ({
      id: p.id,
      title: p.name,
      summary: `${p.enabled ? "enabled" : "disabled"} · entity ${p.entityId ?? "n/a"}`,
      meta: { key: p.key },
    })),
    controls: [
      { id: "configure_saml", label: "Configure SAML IdP", enabled: true },
      { id: "download_sp_metadata", label: "SP metadata", enabled: true },
    ],
    emptyMessage: "No SAML IdPs configured.",
  };
}

export function buildScimCenter(organizationId: string): EnterpriseCenter {
  const scim = enterpriseAdminStore.get(organizationId).scim;
  return {
    id: "scim",
    title: "SCIM",
    subtitle: "User/group directory provisioning",
    status: statusFrom(Boolean(scim?.enabled), Boolean(scim)),
    cards: scim
      ? [
          {
            id: scim.id,
            title: scim.enabled ? "SCIM enabled" : "SCIM configured (disabled)",
            summary: `Users ${scim.syncUsers ? "on" : "off"} · Groups ${scim.syncGroups ? "on" : "off"} · last sync ${scim.lastSyncAt ?? "never"}`,
          },
        ]
      : [],
    controls: [
      { id: "configure_scim", label: "Configure SCIM", enabled: true },
      { id: "sync_dry_run", label: "Run sync (dry-run)", enabled: Boolean(scim?.enabled) },
    ],
    emptyMessage: "SCIM not configured.",
  };
}

export function buildRbacCenter(_organizationId: string): EnterpriseCenter {
  const roles = listEnterpriseRbacRoles();
  const perms = listEnterprisePermissionCatalog();
  return {
    id: "rbac",
    title: "RBAC",
    subtitle: "Role-based access control (soft-reads IAM core permissions)",
    status: "ready",
    cards: [
      {
        id: "rbac-roles",
        title: `${roles.length} roles`,
        summary: roles.map((r) => r.key).join(", "),
        score: roles.length,
      },
      {
        id: "rbac-perms",
        title: `${perms.length} permissions`,
        summary: `IAM + enterprise permission catalog`,
        score: perms.length,
      },
    ],
    controls: [
      { id: "evaluate", label: "Evaluate permission", enabled: true },
      { id: "manage_roles", label: "Manage roles", enabled: true },
    ],
    emptyMessage: "RBAC catalog unavailable.",
  };
}

export function buildAbacCenter(organizationId: string): EnterpriseCenter {
  const policies = enterpriseAdminStore.get(organizationId).abac;
  return {
    id: "abac",
    title: "ABAC",
    subtitle: "Attribute-based access policies",
    status: statusFrom(policies.some((p) => p.enabled), policies.length > 0),
    cards: policies.map((p) => ({
      id: p.id,
      title: p.name,
      summary: `${p.effect} · ${p.actions.join(",")} on ${p.resource} · ${p.conditions.length} condition(s)`,
      meta: { enabled: p.enabled },
    })),
    controls: [
      { id: "add_policy", label: "Add policy", enabled: true },
      { id: "evaluate", label: "Evaluate attributes", enabled: policies.length > 0 },
    ],
    emptyMessage: "No ABAC policies yet.",
  };
}

export function buildDelegatedAdminCenter(organizationId: string): EnterpriseCenter {
  const grants = enterpriseAdminStore.get(organizationId).delegations.filter((d) => d.active);
  return {
    id: "delegated_administration",
    title: "Delegated Administration",
    subtitle: "Temporary authority grants",
    status: statusFrom(grants.length > 0),
    cards: grants.map((g) => ({
      id: g.id,
      title: `${g.fromUserId} → ${g.toUserId}`,
      summary: `Scope ${g.scope} · ${g.permissions.join(", ")} · expires ${g.expiresAt ?? "n/a"}`,
    })),
    controls: [
      { id: "grant", label: "Grant delegation", enabled: true },
      { id: "revoke", label: "Revoke", enabled: grants.length > 0 },
    ],
    emptyMessage: "No active delegations.",
  };
}

export function buildAuditCenter(organizationId: string): EnterpriseCenter {
  const events = enterpriseAdminStore.get(organizationId).audit.slice(0, 20);
  return {
    id: "audit_center",
    title: "Audit Center",
    subtitle: "Administrative and authz audit trail",
    status: events.length ? "configured" : "partial",
    cards: events.map((e) => ({
      id: e.id,
      title: e.action,
      summary: `${e.at.slice(0, 19)} · ${e.resource} · ${e.outcome}`,
      severity: e.outcome === "denied" ? 70 : e.outcome === "error" ? 80 : 20,
    })),
    controls: [{ id: "export", label: "Export audit", enabled: events.length > 0 }],
    emptyMessage: "No audit events yet.",
  };
}

export function buildComplianceCenter(organizationId: string): EnterpriseCenter {
  const controls = enterpriseAdminStore.get(organizationId).compliance;
  return {
    id: "compliance_center",
    title: "Compliance Center",
    subtitle: "Control posture across frameworks",
    status: controls.length ? "configured" : "not_configured",
    cards: controls.map((c) => ({
      id: c.id,
      title: c.name,
      summary: `${c.framework} · ${c.status}${c.evidence ? ` · ${c.evidence}` : ""}`,
      score: c.status === "pass" ? 100 : c.status === "partial" ? 50 : 0,
    })),
    controls: [
      { id: "assess", label: "Re-assess", enabled: true },
      { id: "evidence", label: "Attach evidence", enabled: controls.length > 0 },
    ],
    emptyMessage: "No compliance controls seeded — call seedDefaultCompliance.",
  };
}

export function buildSecurityCenter(organizationId: string): EnterpriseCenter {
  const findings = enterpriseAdminStore.get(organizationId).security;
  const open = findings.filter((f) => f.status === "open");
  return {
    id: "security_center",
    title: "Security Center",
    subtitle: "Security findings and posture",
    status: open.length ? "partial" : findings.length ? "configured" : "not_configured",
    cards: findings.map((f) => ({
      id: f.id,
      title: f.title,
      summary: `${f.severity} · ${f.status} · ${f.summary}`,
      severity:
        f.severity === "critical"
          ? 95
          : f.severity === "high"
            ? 80
            : f.severity === "medium"
              ? 60
              : 30,
    })),
    controls: [
      { id: "acknowledge", label: "Acknowledge finding", enabled: open.length > 0 },
      { id: "scan", label: "Run posture scan", enabled: true },
    ],
    emptyMessage: "No security findings.",
  };
}

export function buildApiKeysCenter(organizationId: string): EnterpriseCenter {
  const keys = enterpriseAdminStore.get(organizationId).apiKeys;
  const active = keys.filter((k) => !k.revokedAt);
  return {
    id: "api_keys",
    title: "API Keys",
    subtitle: "Programmatic access keys (secret shown once at mint)",
    status: statusFrom(active.length > 0, keys.length > 0),
    cards: keys.map((k) => ({
      id: k.id,
      title: k.name,
      summary: `${k.prefix}… · scopes ${k.scopes.join(", ") || "none"} · ${k.revokedAt ? "revoked" : "active"}`,
    })),
    controls: [
      { id: "mint", label: "Mint key", enabled: true },
      { id: "revoke", label: "Revoke key", enabled: active.length > 0 },
    ],
    emptyMessage: "No API keys minted.",
  };
}

export function buildOrganizationCenter(organizationId: string): EnterpriseCenter {
  const org = enterpriseAdminStore.get(organizationId).organization;
  return {
    id: "organization_management",
    title: "Organization Management",
    subtitle: "Tenant organization lifecycle",
    status: org ? "configured" : "not_configured",
    cards: org
      ? [
          {
            id: org.id,
            title: org.name,
            summary: `${org.slug} · ${org.status} · updated ${org.updatedAt.slice(0, 10)}`,
            meta: org.settings,
          },
        ]
      : [],
    controls: [
      { id: "upsert", label: "Create / update org", enabled: true },
      { id: "suspend", label: "Suspend", enabled: Boolean(org && org.status === "active") },
    ],
    emptyMessage: "Organization record not provisioned in enterprise store.",
  };
}

export function buildLicenseCenter(organizationId: string): EnterpriseCenter {
  const license = enterpriseAdminStore.get(organizationId).license;
  return {
    id: "license_management",
    title: "License Management",
    subtitle: "Plan, seats, and renewal",
    status: license ? "configured" : "not_configured",
    cards: license
      ? [
          {
            id: license.id,
            title: license.plan,
            summary: `${license.status} · ${license.seatsUsed}/${license.seats} seats · starts ${license.startsAt.slice(0, 10)}`,
            score: Math.round((license.seatsUsed / Math.max(license.seats, 1)) * 100),
          },
        ]
      : [],
    controls: [
      { id: "assign", label: "Assign license", enabled: true },
      { id: "renew", label: "Renew", enabled: Boolean(license) },
    ],
    emptyMessage: "No license assigned.",
  };
}

export function buildUsageAnalyticsCenter(organizationId: string): EnterpriseCenter {
  const metrics = enterpriseAdminStore.get(organizationId).usage;
  return {
    id: "usage_analytics",
    title: "Usage Analytics",
    subtitle: "Seat, API, and feature usage",
    status: metrics.length ? "configured" : "not_configured",
    cards: metrics.map((m) => ({
      id: m.key,
      title: m.label,
      summary: `${m.value} ${m.unit} · ${m.period}`,
      score: m.value,
    })),
    controls: [{ id: "refresh", label: "Refresh metrics", enabled: true }],
    emptyMessage: "No usage metrics recorded.",
  };
}

export function buildTenantProvisioningCenter(organizationId: string): EnterpriseCenter {
  const jobs = enterpriseAdminStore.get(organizationId).provisionJobs.slice(0, 10);
  return {
    id: "tenant_provisioning",
    title: "Tenant Provisioning",
    subtitle: "Create and bootstrap tenants (dry-run by default)",
    status: jobs.length ? "configured" : "partial",
    cards: jobs.map((j) => ({
      id: j.id,
      title: j.tenantSlug,
      summary: `${j.status} · dryRun=${j.dryRun} · ${j.steps.slice(0, 3).join(", ")}`,
      meta: { error: j.error },
    })),
    controls: [
      { id: "provision_dry_run", label: "Provision (dry-run)", enabled: true },
      { id: "provision", label: "Provision (in-memory)", enabled: true },
    ],
    emptyMessage: "No provisioning jobs yet.",
  };
}

export const CENTER_BUILDERS: Record<
  EnterpriseCenterId,
  (organizationId: string) => EnterpriseCenter
> = {
  sso: buildSsoCenter,
  saml: buildSamlCenter,
  scim: buildScimCenter,
  rbac: buildRbacCenter,
  abac: buildAbacCenter,
  delegated_administration: buildDelegatedAdminCenter,
  audit_center: buildAuditCenter,
  compliance_center: buildComplianceCenter,
  security_center: buildSecurityCenter,
  api_keys: buildApiKeysCenter,
  organization_management: buildOrganizationCenter,
  license_management: buildLicenseCenter,
  usage_analytics: buildUsageAnalyticsCenter,
  tenant_provisioning: buildTenantProvisioningCenter,
};
