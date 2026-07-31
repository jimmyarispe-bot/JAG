/**
 * Blueprint Builder — catalog helpers.
 */

import type {
  CatalogEntry,
  IndustryCatalogPayload,
} from "@/jag/blueprint-framework";
import { BLUEPRINT_FOUNDATION_MODULES } from "@/jag/blueprint-framework";

export function createCatalogEntry(
  id: string,
  label: string,
  extra: Record<string, string> = {}
): CatalogEntry & Record<string, string> {
  return Object.freeze({ id, label, ...extra });
}

export type BuildIndustryCatalogsInput = {
  readonly verticalModules?: readonly string[];
  readonly identityVocabulary: IndustryCatalogPayload["identityVocabulary"];
  readonly documentTypes: IndustryCatalogPayload["documentTypes"];
  readonly communicationTypes: IndustryCatalogPayload["communicationTypes"];
  readonly schedulingConventions: IndustryCatalogPayload["schedulingConventions"];
  readonly workClassifications: IndustryCatalogPayload["workClassifications"];
  readonly decisionCategories: IndustryCatalogPayload["decisionCategories"];
  readonly policyDefaults: IndustryCatalogPayload["policyDefaults"];
  readonly reportingDefaults: IndustryCatalogPayload["reportingDefaults"];
  readonly analyticsDefaults: IndustryCatalogPayload["analyticsDefaults"];
};

/** Build a Blueprint Framework–conformant catalogs payload. */
export function buildIndustryCatalogs(
  input: BuildIndustryCatalogsInput
): IndustryCatalogPayload {
  return Object.freeze({
    foundationModules: BLUEPRINT_FOUNDATION_MODULES,
    verticalModules: Object.freeze([...(input.verticalModules ?? [])]),
    identityVocabulary: Object.freeze([...input.identityVocabulary]),
    documentTypes: Object.freeze([...input.documentTypes]),
    communicationTypes: Object.freeze([...input.communicationTypes]),
    schedulingConventions: Object.freeze([...input.schedulingConventions]),
    workClassifications: Object.freeze([...input.workClassifications]),
    decisionCategories: Object.freeze([...input.decisionCategories]),
    policyDefaults: Object.freeze([...input.policyDefaults]),
    reportingDefaults: Object.freeze([...input.reportingDefaults]),
    analyticsDefaults: Object.freeze([...input.analyticsDefaults]),
  });
}
