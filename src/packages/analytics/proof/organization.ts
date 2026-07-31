/**
 * Proof Organization Blueprint — analytics.core with lean required reporting.core
 * plus full operational stack (including policy) for Runtime Generation proof.
 */

import type { OrganizationBlueprint } from "@/jag/blueprints";
import {
  EDUCATION_INDUSTRY_ENTITIES,
  EducationIndustryBlueprint,
} from "@/jag/blueprints";
import { buildAnalyticsCapabilityPacks } from "@/packages/analytics/capability-packs";
import { analyticsPackCatalogPayload } from "@/packages/analytics/capability-packs/assemble";
import {
  ANALYTICS_APPLICATION_ID,
  ANALYTICS_PACKAGE_ID,
  ANALYTICS_PACKAGE_VERSION,
} from "@/packages/analytics/package";
import { buildCommunicationsCapabilityPacks } from "@/packages/communications/capability-packs";
import { buildDecisionCapabilityPacks } from "@/packages/decision/capability-packs";
import { buildDocumentsCapabilityPacks } from "@/packages/documents/capability-packs";
import { buildIdentityCapabilityPacks } from "@/packages/identity/capability-packs";
import { buildPolicyCapabilityPacks } from "@/packages/policy/capability-packs";
import { buildReportingCapabilityPacks } from "@/packages/reporting/capability-packs";
import { buildSchedulingCapabilityPacks } from "@/packages/scheduling/capability-packs";
import { buildWorkCapabilityPacks } from "@/packages/work/capability-packs";

export function buildAnalyticsProofOrganizationBlueprint(): OrganizationBlueprint {
  const packs = Object.freeze([
    ...buildIdentityCapabilityPacks(),
    ...buildDocumentsCapabilityPacks(),
    ...buildCommunicationsCapabilityPacks(),
    ...buildSchedulingCapabilityPacks(),
    ...buildWorkCapabilityPacks(),
    ...buildDecisionCapabilityPacks(),
    ...buildReportingCapabilityPacks(),
    ...buildPolicyCapabilityPacks(),
    ...buildAnalyticsCapabilityPacks(),
  ]);

  return Object.freeze({
    id: "proof.organization.analytics",
    industryId: EducationIndustryBlueprint.id,
    packageId: ANALYTICS_PACKAGE_ID,
    applicationId: ANALYTICS_APPLICATION_ID,
    displayName: "Analytics Proof Organization",
    description:
      "Proof tenant for Universal Organizational Analytics (analytics.core).",
    version: ANALYTICS_PACKAGE_VERSION,
    publisher: "JAG",
    tags: Object.freeze(["analytics", "proof", "production-pack"]),
    enabledModules: Object.freeze([
      "identity",
      "documents",
      "communications",
      "scheduling",
      "work",
      "decision",
      "reporting",
      "policy",
      "analytics",
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
        organization: "analytics-proof",
        brand: "Analytics Proof Organization",
        analyticsCatalogs: analyticsPackCatalogPayload(),
        source: "analytics-pack-proof",
      }),
    }),
  });
}
