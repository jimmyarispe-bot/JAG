/**
 * Proof Organization Blueprint — third-party attach of work.core
 * with declarative foundation dependency packs.
 */

import type { OrganizationBlueprint } from "@/jag/blueprints";
import {
  EDUCATION_INDUSTRY_ENTITIES,
  EducationIndustryBlueprint,
} from "@/jag/blueprints";
import { buildCommunicationsCapabilityPacks } from "@/packages/communications/capability-packs";
import { buildDocumentsCapabilityPacks } from "@/packages/documents/capability-packs";
import { buildIdentityCapabilityPacks } from "@/packages/identity/capability-packs";
import { buildSchedulingCapabilityPacks } from "@/packages/scheduling/capability-packs";
import { buildWorkCapabilityPacks } from "@/packages/work/capability-packs";
import { workPackCatalogPayload } from "@/packages/work/capability-packs/assemble";
import {
  WORK_APPLICATION_ID,
  WORK_PACKAGE_ID,
  WORK_PACKAGE_VERSION,
} from "@/packages/work/package";

export function buildWorkProofOrganizationBlueprint(): OrganizationBlueprint {
  const packs = Object.freeze([
    ...buildIdentityCapabilityPacks(),
    ...buildDocumentsCapabilityPacks(),
    ...buildCommunicationsCapabilityPacks(),
    ...buildSchedulingCapabilityPacks(),
    ...buildWorkCapabilityPacks(),
  ]);

  return Object.freeze({
    id: "proof.organization.work",
    industryId: EducationIndustryBlueprint.id,
    packageId: WORK_PACKAGE_ID,
    applicationId: WORK_APPLICATION_ID,
    displayName: "Work Proof Organization",
    description:
      "Proof tenant for Universal Organizational Work (work.core).",
    version: WORK_PACKAGE_VERSION,
    publisher: "JAG",
    tags: Object.freeze(["work", "proof", "production-pack"]),
    enabledModules: Object.freeze([
      "identity",
      "documents",
      "communications",
      "scheduling",
      "work",
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
        organization: "work-proof",
        brand: "Work Proof Organization",
        workCatalogs: workPackCatalogPayload(),
        source: "work-pack-proof",
      }),
    }),
  });
}
