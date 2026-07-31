/**
 * Resolve Industry → Capability Packs → Organization → Resolved Runtime Model.
 */

import type {
  CapabilityPack,
  IndustryBlueprint,
  OrganizationBlueprint,
} from "@/jag/blueprints/contracts";
import type {
  GenerationPlan,
  ResolvedRuntimeModel,
} from "@/jag/runtime-generation/contracts";
import {
  applyDisableLists,
  mergeContributionLayers,
  normalizeContributionBundle,
} from "@/jag/runtime-generation/inheritance";
import { organizationOverlayBundle } from "@/jag/runtime-generation/overlays";
import { selectCapabilityPacks } from "@/jag/runtime-generation/planner";

export function resolveRuntimeModel(
  industry: IndustryBlueprint,
  organization: OrganizationBlueprint,
  plan: GenerationPlan,
  extraPacks?: readonly CapabilityPack[]
): ResolvedRuntimeModel {
  const packs = selectCapabilityPacks(
    organization,
    extraPacks,
    plan.enabledModules
  );

  const industryLayer = {
    entities: industry.entities,
    processes: industry.processes,
    decisions: industry.decisions,
    forms: industry.forms,
    documents: industry.documents,
    communications: industry.communications,
    permissions: industry.permissions,
    reports: industry.reports,
    navigation: industry.navigation,
    workflows: industry.workflows,
    terminology: industry.terminology,
    localization: industry.localization,
    integrations: industry.integrations,
  };

  const merged = mergeContributionLayers([
    industryLayer,
    ...packs,
    organizationOverlayBundle(organization),
  ]);

  const disabled = applyDisableLists(merged, organization);
  const normalized = normalizeContributionBundle(disabled);

  const tags = Object.freeze([
    ...new Set([
      industry.id,
      ...(industry.tags ?? []),
      ...(organization.tags ?? []),
      "runtime-generation",
    ]),
  ]);

  return Object.freeze({
    metadata: Object.freeze({
      id: organization.packageId,
      applicationId: organization.applicationId,
      displayName: organization.displayName,
      description:
        organization.description ??
        industry.description ??
        `${organization.displayName} (${industry.label})`,
      version: organization.version,
      publisher: organization.publisher,
      tags,
    }),
    ...normalized,
    configuration: Object.freeze({
      keys: Object.freeze({
        ...(industry.configuration?.keys ?? {}),
        ...(organization.configuration?.keys ?? {}),
        industryId: industry.id,
        organizationBlueprintId: organization.id,
        enabledModules: plan.enabledModules,
        disabledModules: plan.disabledModules,
        selectedPackIds: plan.selectedPackIds,
        generatedBy: "runtime-generation",
      }),
    }),
    selectedPackIds: plan.selectedPackIds,
    enabledModules: plan.enabledModules,
  });
}
