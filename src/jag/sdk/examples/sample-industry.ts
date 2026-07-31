/**
 * SDK example — Nonprofit industry blueprint built only via @/jag/sdk.
 */

import {
  buildIndustryBlueprint,
  buildIndustryCatalogs,
  createCatalogEntry,
  validateBlueprint,
} from "@/jag/sdk";

const catalogs = buildIndustryCatalogs({
  verticalModules: Object.freeze(["fundraising", "volunteers"]),
  identityVocabulary: Object.freeze([
    createCatalogEntry("donor", "Donor"),
    createCatalogEntry("volunteer", "Volunteer"),
    createCatalogEntry("beneficiary", "Beneficiary"),
  ]),
  documentTypes: Object.freeze([
    createCatalogEntry("grant_application", "Grant Application", {
      family: "form",
    }),
    createCatalogEntry("donation_receipt", "Donation Receipt", {
      family: "receipt",
    }),
  ]),
  communicationTypes: Object.freeze([
    createCatalogEntry("donor_update", "Donor Update"),
    createCatalogEntry("volunteer_call", "Volunteer Call"),
  ]),
  schedulingConventions: Object.freeze([
    createCatalogEntry("volunteer_shift", "Volunteer Shift", {
      schedulableTypeHint: "shift",
    }),
    createCatalogEntry("fundraising_event", "Fundraising Event", {
      schedulableTypeHint: "event",
    }),
  ]),
  workClassifications: Object.freeze([
    createCatalogEntry("campaign_task", "Campaign Task", { workType: "task" }),
    createCatalogEntry("grant_milestone", "Grant Milestone", {
      workType: "milestone",
    }),
  ]),
  decisionCategories: Object.freeze([
    createCatalogEntry("grant_award", "Grant Award", { category: "strategic" }),
    createCatalogEntry("program_change", "Program Change", {
      category: "operational",
    }),
  ]),
  policyDefaults: Object.freeze([
    createCatalogEntry("donor_privacy", "Donor Privacy", { family: "policy" }),
    createCatalogEntry("volunteer_conduct", "Volunteer Conduct", {
      family: "standard",
    }),
  ]),
  reportingDefaults: Object.freeze([
    createCatalogEntry("donation_activity", "Donation Activity", {
      reportType: "operational",
    }),
    createCatalogEntry("volunteer_hours", "Volunteer Hours", {
      reportType: "status",
    }),
  ]),
  analyticsDefaults: Object.freeze([
    createCatalogEntry("donor_retention", "Donor Retention", {
      metricHint: "retention",
    }),
    createCatalogEntry("campaign_yield", "Campaign Yield", {
      metricHint: "yield",
    }),
  ]),
});

/** Example industry — not registered in the production industry catalog. */
export const exampleNonprofitIndustryBlueprint = buildIndustryBlueprint({
  id: "nonprofit-example",
  label: "Nonprofit (SDK Example)",
  version: "1.0.0",
  description:
    "SDK example industry blueprint — declarative catalogs only.",
  tags: Object.freeze(["nonprofit", "sdk-example"]),
  verticalModules: Object.freeze(["fundraising", "volunteers"]),
  catalogs,
  studioProfile: Object.freeze({
    locationKinds: Object.freeze(["office", "region"]),
    suggestedPrograms: Object.freeze([
      Object.freeze({
        id: "fundraising",
        label: "Fundraising",
        category: "development",
      }),
    ]),
    suggestedRoles: Object.freeze([
      Object.freeze({ id: "executive_director", label: "Executive Director" }),
    ]),
    questionHints: Object.freeze({
      modules: "Enable foundation modules plus fundraising and volunteers.",
    }),
  }),
});

export function validateExampleNonprofitIndustry() {
  return validateBlueprint(exampleNonprofitIndustryBlueprint);
}
