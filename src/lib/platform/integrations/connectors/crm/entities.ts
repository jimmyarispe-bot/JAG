/**
 * RC-3.04 — CRM Connectors
 * HubSpot · Salesforce → shared canonical CRM entities (no vendor models leave).
 */

export const CRM_PROVIDERS = ["hubspot", "salesforce"] as const;
export type CrmProvider = (typeof CRM_PROVIDERS)[number];

export const CRM_OBJECT_TYPES = [
  "lead",
  "contact",
  "company",
  "deal",
  "opportunity",
  "activity",
  "pipeline",
] as const;

export type CrmObjectType = (typeof CRM_OBJECT_TYPES)[number];

export const CRM_KG_KINDS = [
  "Person",
  "Organization",
  "Opportunity",
  "Task",
  "Portfolio",
  "Lead",
] as const;

export type CrmKgKind = (typeof CRM_KG_KINDS)[number];

export type CrmRawEntity = {
  id: string;
  objectType: CrmObjectType;
  provider: CrmProvider;
  organizationId: string;
  updatedAt: string;
  version: number;
  payload: Record<string, unknown>;
};

export type CrmCanonicalEntity = {
  id: string;
  externalId: string;
  organizationId: string;
  sourceSystem: CrmProvider;
  syncedAt: string;
  version: number;
  objectType: CrmObjectType;
  canonicalType: string;
  attributes: Record<string, unknown>;
};
