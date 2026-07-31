/**
 * Runtime Planner — deterministic generation plan from industry + organization.
 */

import type {
  CapabilityPack,
  IndustryBlueprint,
  OrganizationBlueprint,
} from "@/jag/blueprints/contracts";
import { resolveEnabledCapabilityPacks } from "@/jag/capability-packs";
import type {
  GenerationPlan,
  RuntimeArtifactKind,
} from "@/jag/runtime-generation/contracts";

const ALL_ARTIFACTS: readonly RuntimeArtifactKind[] = Object.freeze([
  "entities",
  "processes",
  "decisions",
  "forms",
  "documents",
  "communications",
  "permissions",
  "reports",
  "navigation",
  "workflows",
  "terminology",
  "localization",
  "integrations",
]);

function overlayKeys(organization: OrganizationBlueprint): string[] {
  const keys: string[] = [];
  if (organization.entities?.length) keys.push("entities");
  if (organization.processes?.length) keys.push("processes");
  if (organization.decisions?.length) keys.push("decisions");
  if (organization.forms?.length) keys.push("forms");
  if (organization.documents) keys.push("documents");
  if (organization.communications) keys.push("communications");
  if (organization.permissions?.length) keys.push("permissions");
  if (organization.reports?.length) keys.push("reports");
  if (organization.navigation?.length) keys.push("navigation");
  if (organization.workflows?.length) keys.push("workflows");
  if (organization.terminology?.length) keys.push("terminology");
  if (organization.localization?.length) keys.push("localization");
  if (organization.integrations?.length) keys.push("integrations");
  if (organization.capabilityPacks?.length) keys.push("capabilityPacks");
  return keys.sort((a, b) => a.localeCompare(b));
}

export function selectCapabilityPacks(
  organization: OrganizationBlueprint,
  extraPacks: readonly CapabilityPack[] | undefined,
  enabledModules: readonly string[]
): CapabilityPack[] {
  const candidates = [
    ...(organization.capabilityPacks ?? []),
    ...(extraPacks ?? []),
  ];
  const resolved = resolveEnabledCapabilityPacks({
    industryId: organization.industryId,
    enabledModules,
    availablePacks: candidates,
  });
  return [...resolved.selected];
}

/** Build a deterministic generation plan. */
export function planRuntimeGeneration(
  industry: IndustryBlueprint,
  organization: OrganizationBlueprint,
  extraPacks?: readonly CapabilityPack[]
): GenerationPlan {
  const enabledModules = Object.freeze([
    ...(organization.enabledModules ?? industry.modules ?? []),
  ]);
  const disabledModules = Object.freeze([
    ...(organization.disabledModules ?? []),
  ]);
  const filteredModules = Object.freeze(
    enabledModules.filter((m) => !disabledModules.includes(m))
  );
  const selected = selectCapabilityPacks(
    organization,
    extraPacks,
    filteredModules
  );

  return Object.freeze({
    industryId: industry.id,
    organizationId: organization.id,
    packageId: organization.packageId,
    applicationId: organization.applicationId,
    enabledModules: filteredModules,
    disabledModules,
    selectedPackIds: Object.freeze(selected.map((p) => p.id)),
    requiredArtifacts: ALL_ARTIFACTS,
    organizationOverlayKeys: Object.freeze(overlayKeys(organization)),
  });
}
