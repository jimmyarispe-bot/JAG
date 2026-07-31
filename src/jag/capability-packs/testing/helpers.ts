import type { CapabilityPack } from "@/jag/blueprints/contracts";
import { getCapabilityPackLicense } from "@/jag/capability-packs/licensing";
import { resetDefaultCapabilityPackCatalogForTests } from "@/jag/capability-packs/discovery";

export function resetCapabilityPackArchitectureForTests(): void {
  resetDefaultCapabilityPackCatalogForTests();
}

/** Minimal valid published pack for architecture tests (no contributions). */
export function createTestCapabilityPack(
  overrides: Partial<CapabilityPack> & Pick<CapabilityPack, "id">
): CapabilityPack {
  return Object.freeze({
    id: overrides.id,
    label: overrides.label ?? overrides.id,
    name: overrides.name ?? overrides.label ?? overrides.id,
    version: overrides.version ?? "1.0.0",
    status: overrides.status ?? "published",
    license:
      overrides.license ?? getCapabilityPackLicense("jag.reference"),
    modules: overrides.modules ?? overrides.providesModules ?? ["core"],
    providesModules:
      overrides.providesModules ?? overrides.modules ?? ["core"],
    description: overrides.description,
    publisher: overrides.publisher ?? "JAG",
    tags: overrides.tags,
    dependencies: overrides.dependencies,
    compatibility: overrides.compatibility,
    deprecated: overrides.deprecated,
    upgrades: overrides.upgrades,
    discovery: overrides.discovery,
    entities: overrides.entities,
    processes: overrides.processes,
    decisions: overrides.decisions,
    forms: overrides.forms,
    documents: overrides.documents,
    communications: overrides.communications,
    permissions: overrides.permissions,
    reports: overrides.reports,
    navigation: overrides.navigation,
    workflows: overrides.workflows,
    terminology: overrides.terminology,
    localization: overrides.localization,
    integrations: overrides.integrations,
  });
}
