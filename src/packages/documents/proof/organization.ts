/**
 * Proof Organization Blueprint — third-party attach of documents.core.
 */

import type { OrganizationBlueprint } from "@/jag/blueprints";
import {
  EDUCATION_INDUSTRY_ENTITIES,
  EducationIndustryBlueprint,
} from "@/jag/blueprints";
import { documentsPackCatalogPayload } from "@/packages/documents/capability-packs/assemble";
import { buildDocumentsCapabilityPacks } from "@/packages/documents/capability-packs";
import {
  DOCUMENTS_APPLICATION_ID,
  DOCUMENTS_PACKAGE_ID,
  DOCUMENTS_PACKAGE_VERSION,
} from "@/packages/documents/package";

export function buildDocumentsProofOrganizationBlueprint(): OrganizationBlueprint {
  const packs = buildDocumentsCapabilityPacks();

  return Object.freeze({
    id: "proof.organization.documents",
    industryId: EducationIndustryBlueprint.id,
    packageId: DOCUMENTS_PACKAGE_ID,
    applicationId: DOCUMENTS_APPLICATION_ID,
    displayName: "Documents Proof Organization",
    description:
      "Proof tenant for Universal Organizational Documents (documents.core).",
    version: DOCUMENTS_PACKAGE_VERSION,
    publisher: "JAG",
    tags: Object.freeze(["documents", "proof", "production-pack"]),
    enabledModules: Object.freeze(["documents"]),
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
        organization: "documents-proof",
        brand: "Documents Proof Organization",
        documentsCatalogs: documentsPackCatalogPayload(),
        source: "documents-pack-proof",
      }),
    }),
  });
}
