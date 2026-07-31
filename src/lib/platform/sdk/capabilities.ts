import type {
  ApplicationManifest,
  CapabilityResolution,
  PlatformCapability,
} from "@/lib/platform/sdk/types";

/** Catalog of platform capabilities (explicit declaration required). */
export const PLATFORM_CAPABILITIES = [
  "entities",
  "schemas",
  "forms",
  "workflows",
  "apis",
  "graph",
  "forecasting",
  "automation",
  "notifications",
  "decisions",
  "permissions",
] as const satisfies readonly PlatformCapability[];

export const PLATFORM_CAPABILITY_LABELS: Record<PlatformCapability, string> = {
  entities: "Entity Framework",
  schemas: "Universal Schema Registry",
  forms: "Forms Framework",
  workflows: "Workflow Framework",
  apis: "API Framework",
  graph: "Knowledge Graph",
  forecasting: "Forecasting",
  automation: "Automation",
  notifications: "Notifications",
  decisions: "Decisions",
  permissions: "Permissions / IAM",
};

const CAPABILITY_SET = new Set<string>(PLATFORM_CAPABILITIES);

export function isPlatformCapability(value: string): value is PlatformCapability {
  return CAPABILITY_SET.has(value);
}

/**
 * Infer capabilities required by manifest artifact lists.
 * No implicit registration — used only for validation against declarations.
 */
export function capabilitiesRequiredByArtifacts(
  manifest: ApplicationManifest
): PlatformCapability[] {
  const required = new Set<PlatformCapability>();

  if (manifest.schemas.length) required.add("schemas");
  if (manifest.entities.length) required.add("entities");
  if (manifest.forms.length) required.add("forms");
  if (manifest.workflows.length) required.add("workflows");
  if (manifest.apis.length) required.add("apis");
  if (manifest.permissions.length) required.add("permissions");
  if (manifest.automation.length) required.add("automation");

  // Graph / forecasting / notifications / decisions are declaration-only
  // unless listed in capabilities — artifact lists do not imply them.

  return [...required];
}

export function resolveCapabilities(
  manifest: ApplicationManifest
): CapabilityResolution {
  const declared = [...new Set(manifest.capabilities)];
  const requiredByArtifacts = capabilitiesRequiredByArtifacts(manifest);
  const declaredSet = new Set(declared);
  const missing = requiredByArtifacts.filter((c) => !declaredSet.has(c));
  const requiredSet = new Set(requiredByArtifacts);
  const unused = declared.filter((c) => !requiredSet.has(c));

  return { declared, requiredByArtifacts, missing, unused };
}

export function hasCapability(
  manifest: ApplicationManifest,
  capability: PlatformCapability
): boolean {
  return manifest.capabilities.includes(capability);
}
