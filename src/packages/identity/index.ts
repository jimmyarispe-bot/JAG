/**
 * Identity Capability Pack — Universal Organizational Identity.
 */

export {
  IDENTITY_APPLICATION_ID,
  IDENTITY_PACKAGE_ID,
  IDENTITY_PACKAGE_VERSION,
  IDENTITY_PACK_ID,
} from "@/packages/identity/package";

export {
  buildIdentityCapabilityPacks,
  buildIdentityCorePack,
  describeIdentityCorePack,
  assembleIdentityContributionBundle,
  identityPackCatalogPayload,
} from "@/packages/identity/capability-packs";

export { IDENTITY_ENTITY_DEFINITIONS } from "@/packages/identity/entities";
export {
  IDENTITY_PERMISSION_KEYS,
  IDENTITY_PERMISSION_PACK,
  IDENTITY_PERMISSION_PACK_ID,
  IDENTITY_PERMISSION_PACKS,
} from "@/packages/identity/permissions";
export { IDENTITY_NAVIGATION } from "@/packages/identity/navigation";
export {
  IDENTITY_LIFECYCLE_STATES,
  IDENTITY_ROLE_EXAMPLES,
  IDENTITY_GROUP_KINDS,
  IDENTITY_PERMISSION_BINDING_KINDS,
} from "@/packages/identity/catalogs";

export {
  buildIdentityProofOrganizationBlueprint,
  compileIdentityProofRuntime,
  generateIdentityProofRuntime,
  registerIdentityHandwrittenBaseline,
  resetIdentityProofPortsForTests,
  listIdentityProofPermissionPacks,
} from "@/packages/identity/proof";
