/**
 * Blueprint Builder — Industry Blueprint factory.
 */

import type { IndustryBlueprint, IndustryStudioProfile } from "@/jag/blueprints/contracts";
import type { IndustryCatalogPayload } from "@/jag/blueprint-framework";
import {
  buildFoundationComposition,
  buildModuleList,
} from "@/jag/sdk/builders/modules";

export type BuildIndustryBlueprintInput = {
  readonly id: string;
  readonly label: string;
  readonly version: string;
  readonly description?: string;
  readonly tags?: readonly string[];
  readonly verticalModules?: readonly string[];
  readonly catalogs: IndustryCatalogPayload;
  readonly studioProfile?: IndustryStudioProfile;
  readonly blueprintEdition?: string;
  readonly extraConfigurationKeys?: Readonly<Record<string, unknown>>;
};

/**
 * Create a declarative Industry Blueprint that targets Blueprint Framework v1.
 * Does not attach pack ids or runtime logic.
 */
export function buildIndustryBlueprint(
  input: BuildIndustryBlueprintInput
): IndustryBlueprint {
  const verticalModules = input.verticalModules ?? [];
  const composition = buildFoundationComposition({
    version: input.version,
    verticalModules,
  });
  const modules = buildModuleList(verticalModules);

  return Object.freeze({
    id: input.id,
    label: input.label,
    description: input.description,
    version: input.version,
    tags: Object.freeze([...(input.tags ?? [input.id, "declarative"])]),
    modules,
    studioProfile: input.studioProfile,
    configuration: Object.freeze({
      keys: Object.freeze({
        industry: input.id,
        blueprintEdition: input.blueprintEdition ?? "v1",
        composition,
        catalogs: input.catalogs,
        ...(input.extraConfigurationKeys ?? {}),
      }),
    }),
  });
}
