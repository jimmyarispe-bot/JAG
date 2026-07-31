/**
 * Proof Organization Blueprint — third-party style attach of identity.core.
 * No Academy imports. No handwritten ApplicationModel.
 */

import type { OrganizationBlueprint } from "@/jag/blueprints";
import {
  EDUCATION_INDUSTRY_ENTITIES,
  EducationIndustryBlueprint,
} from "@/jag/blueprints";
import { buildIdentityCapabilityPacks } from "@/packages/identity/capability-packs";
import {
  IDENTITY_APPLICATION_ID,
  IDENTITY_PACKAGE_ID,
  IDENTITY_PACKAGE_VERSION,
} from "@/packages/identity/package";
import { identityPackCatalogPayload } from "@/packages/identity/capability-packs/assemble";

/**
 * Minimal organization that enables the Identity module and attaches identity.core.
 */
export function buildIdentityProofOrganizationBlueprint(): OrganizationBlueprint {
  const packs = buildIdentityCapabilityPacks();

  return Object.freeze({
    id: "proof.organization.identity",
    industryId: EducationIndustryBlueprint.id,
    packageId: IDENTITY_PACKAGE_ID,
    applicationId: IDENTITY_APPLICATION_ID,
    displayName: "Identity Proof Organization",
    description:
      "Proof tenant for Universal Organizational Identity (identity.core).",
    version: IDENTITY_PACKAGE_VERSION,
    publisher: "JAG",
    tags: Object.freeze(["identity", "proof", "production-pack"]),
    enabledModules: Object.freeze(["identity"]),
    capabilityPacks: packs,
    // Isolate proof runtime to Identity contributions (industry samples disabled).
    disableEntityTypes: Object.freeze(
      EDUCATION_INDUSTRY_ENTITIES.map((e) => e.entityType)
    ),
    disablePermissionIds: Object.freeze(
      (EducationIndustryBlueprint.permissions ?? []).map((p) => p.id)
    ),
    disableReportIds: Object.freeze(
      (EducationIndustryBlueprint.reports ?? []).map((r) => r.id)
    ),
    disableTerminologyIds: Object.freeze(
      (EducationIndustryBlueprint.terminology ?? []).map((t) => t.id)
    ),
    disableIntegrationIds: Object.freeze(
      (EducationIndustryBlueprint.integrations ?? []).map((i) => i.id)
    ),
    configuration: Object.freeze({
      keys: Object.freeze({
        organization: "identity-proof",
        brand: "Identity Proof Organization",
        identityCatalogs: identityPackCatalogPayload(),
        source: "identity-pack-proof",
      }),
    }),
  });
}
