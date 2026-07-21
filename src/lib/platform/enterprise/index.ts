/**
 * RC-9 — Enterprise Administration
 *
 * Soft-reads IAM permission catalogs. Mutations are in-memory / intent-only
 * for CI — live IdP/SCIM/cloud adapters stay outside this package.
 *
 * Note: Integration connectors live at
 * `@/lib/platform/integrations/connectors/enterprise` (separate package).
 */

export {
  ENTERPRISE_ADMIN_VERSION,
  ENTERPRISE_CENTERS,
  type EnterpriseCenterId,
  type EnterpriseCenter,
  type EnterpriseAdminWorkspace,
  type AuthzDecision,
} from "./types";

export { enterpriseAdminStore } from "./store/enterprise-store";

export { evaluateRbac } from "./authz/rbac";
export { evaluateAbac } from "./authz/abac";

export {
  buildEnterpriseAdminWorkspace,
  createEnterpriseAdminEngine,
  type BuildEnterpriseAdminInput,
} from "./engine/enterprise-admin";
