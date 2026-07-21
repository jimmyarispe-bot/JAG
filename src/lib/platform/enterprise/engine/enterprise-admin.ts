/**
 * RC-9 — Enterprise Administration workspace builder + facade.
 */

import { CENTER_BUILDERS } from "@/lib/platform/enterprise/centers/panels";
import {
  evaluateRbac,
  listEnterprisePermissionCatalog,
  listEnterpriseRbacRoles,
} from "@/lib/platform/enterprise/authz/rbac";
import { evaluateAbac, evaluateRbacAbac } from "@/lib/platform/enterprise/authz/abac";
import { enterpriseAdminStore } from "@/lib/platform/enterprise/store/enterprise-store";
import * as mutations from "@/lib/platform/enterprise/services/mutations";
import {
  ENTERPRISE_ADMIN_VERSION,
  ENTERPRISE_CENTERS,
  type EnterpriseAdminWorkspace,
  type EnterpriseCenter,
  type EnterpriseCenterId,
} from "@/lib/platform/enterprise/types";

export type BuildEnterpriseAdminInput = {
  organizationId: string;
  now?: () => Date;
  /** Seed baseline compliance/security cards when empty. */
  seedDefaults?: boolean;
};

export function buildEnterpriseAdminWorkspace(
  input: BuildEnterpriseAdminInput
): EnterpriseAdminWorkspace {
  const { organizationId } = input;
  if (input.seedDefaults !== false) {
    const bucket = enterpriseAdminStore.get(organizationId);
    if (!bucket.compliance.length) mutations.seedDefaultCompliance(organizationId);
    if (!bucket.security.length) mutations.seedDefaultSecurity(organizationId);
    if (!bucket.organization) {
      mutations.upsertOrganization({
        id: organizationId,
        slug: organizationId.replace(/^org-/, "") || organizationId,
        name: `Organization ${organizationId}`,
        status: "active",
        settings: {},
      });
    }
  }

  const centers = {} as Record<EnterpriseCenterId, EnterpriseCenter>;
  for (const id of ENTERPRISE_CENTERS) {
    centers[id] = CENTER_BUILDERS[id](organizationId);
  }

  const configured = ENTERPRISE_CENTERS.filter(
    (id) => centers[id].status === "configured" || centers[id].status === "ready"
  ).length;
  const healthValue = Math.round((configured / ENTERPRISE_CENTERS.length) * 100);
  const healthLabel =
    healthValue >= 75 ? "strong" : healthValue >= 45 ? "watch" : "critical";

  return {
    version: ENTERPRISE_ADMIN_VERSION,
    organizationId,
    generatedAt: (input.now ?? (() => new Date()))().toISOString(),
    centers,
    centerOrder: [...ENTERPRISE_CENTERS],
    healthScore: { value: healthValue, label: healthLabel },
    summary: `Enterprise Administration online — ${configured}/${ENTERPRISE_CENTERS.length} centers ready/configured.`,
    contributingDomains: ["enterprise-admin", "iam"],
    governance: {
      mayAutoExecute: false,
      vendorIdpRequiredForLiveSso: true,
      mutationsAreIntentOnlyUnlessLiveAdapter: true,
    },
  };
}

export class EnterpriseAdminEngine {
  readonly version = ENTERPRISE_ADMIN_VERSION;

  build(input: BuildEnterpriseAdminInput) {
    return buildEnterpriseAdminWorkspace(input);
  }

  listCenters() {
    return [...ENTERPRISE_CENTERS];
  }

  listRoles() {
    return listEnterpriseRbacRoles();
  }

  listPermissions() {
    return listEnterprisePermissionCatalog();
  }

  evaluateRbac(roleKeys: string[], permission: string) {
    return evaluateRbac({ roleKeys, permission });
  }

  evaluateAbac(
    organizationId: string,
    action: string,
    resource: string,
    attributes: Record<string, unknown>
  ) {
    return evaluateAbac({ organizationId, action, resource, attributes });
  }

  evaluateAccess(input: {
    organizationId: string;
    roleKeys: string[];
    permission: string;
    action: string;
    resource: string;
    attributes: Record<string, unknown>;
  }) {
    return evaluateRbacAbac({ ...input, evaluateRbac });
  }

  configureSso = mutations.configureSso;
  configureSaml = mutations.configureSaml;
  configureScim = mutations.configureScim;
  runScimSyncDryRun = mutations.runScimSyncDryRun;
  upsertAbacPolicy = mutations.upsertAbacPolicy;
  grantDelegation = mutations.grantDelegation;
  mintApiKey = mutations.mintApiKey;
  revokeApiKey = mutations.revokeApiKey;
  upsertOrganization = mutations.upsertOrganization;
  assignLicense = mutations.assignLicense;
  recordUsage = mutations.recordUsage;
  provisionTenant = mutations.provisionTenant;
}

export function createEnterpriseAdminEngine(): EnterpriseAdminEngine {
  return new EnterpriseAdminEngine();
}
