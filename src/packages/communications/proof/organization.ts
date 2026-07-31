/**
 * Proof Organization Blueprint — third-party attach of communications.core
 * with declarative identity.core + documents.core dependencies present.
 */

import type { OrganizationBlueprint } from "@/jag/blueprints";
import {
  EDUCATION_INDUSTRY_ENTITIES,
  EducationIndustryBlueprint,
} from "@/jag/blueprints";
import { buildCommunicationsCapabilityPacks } from "@/packages/communications/capability-packs";
import { communicationsPackCatalogPayload } from "@/packages/communications/capability-packs/assemble";
import {
  COMMUNICATIONS_APPLICATION_ID,
  COMMUNICATIONS_PACKAGE_ID,
  COMMUNICATIONS_PACKAGE_VERSION,
} from "@/packages/communications/package";
import { buildDocumentsCapabilityPacks } from "@/packages/documents/capability-packs";
import { buildIdentityCapabilityPacks } from "@/packages/identity/capability-packs";

export function buildCommunicationsProofOrganizationBlueprint(): OrganizationBlueprint {
  const packs = Object.freeze([
    ...buildIdentityCapabilityPacks(),
    ...buildDocumentsCapabilityPacks(),
    ...buildCommunicationsCapabilityPacks(),
  ]);

  return Object.freeze({
    id: "proof.organization.communications",
    industryId: EducationIndustryBlueprint.id,
    packageId: COMMUNICATIONS_PACKAGE_ID,
    applicationId: COMMUNICATIONS_APPLICATION_ID,
    displayName: "Communications Proof Organization",
    description:
      "Proof tenant for Universal Organizational Communications (communications.core).",
    version: COMMUNICATIONS_PACKAGE_VERSION,
    publisher: "JAG",
    tags: Object.freeze(["communications", "proof", "production-pack"]),
    // Enable dependency modules so Runtime Generation selects and validates the full pack set.
    enabledModules: Object.freeze([
      "identity",
      "documents",
      "communications",
    ]),
    capabilityPacks: packs,
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
        organization: "communications-proof",
        brand: "Communications Proof Organization",
        communicationsCatalogs: communicationsPackCatalogPayload(),
        source: "communications-pack-proof",
      }),
    }),
  });
}
