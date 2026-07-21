import type { CrmKgKind, CrmObjectType } from "@/lib/platform/integrations/connectors/crm/entities";

/** Provider-neutral dotted JAG types. */
export const CANONICAL_TYPE: Record<CrmObjectType, string> = {
  lead: "crm.lead",
  contact: "crm.contact",
  company: "crm.account",
  deal: "crm.opportunity",
  opportunity: "crm.opportunity",
  activity: "crm.activity",
  pipeline: "crm.pipeline",
};

export const KG_KIND_FOR_OBJECT: Partial<Record<CrmObjectType, CrmKgKind>> = {
  lead: "Lead",
  contact: "Person",
  company: "Organization",
  deal: "Opportunity",
  opportunity: "Opportunity",
  activity: "Task",
  pipeline: "Portfolio",
};

export function crmCanonicalType(objectType: string): string {
  return CANONICAL_TYPE[objectType as CrmObjectType] ?? `crm.${objectType}`;
}

export function crmKgKind(objectType: string): CrmKgKind | null {
  return KG_KIND_FOR_OBJECT[objectType as CrmObjectType] ?? null;
}
