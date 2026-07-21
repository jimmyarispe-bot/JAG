/**
 * Deterministic demo SoR catalogs for HubSpot and Salesforce.
 */

import type {
  CrmObjectType,
  CrmProvider,
  CrmRawEntity,
} from "@/lib/platform/integrations/connectors/crm/entities";

function entity(
  provider: CrmProvider,
  objectType: CrmObjectType,
  id: string,
  organizationId: string,
  version: number,
  payload: Record<string, unknown>,
  updatedAt: string
): CrmRawEntity {
  return {
    id,
    objectType,
    provider,
    organizationId,
    updatedAt,
    version,
    payload: { ...payload, name: payload.name ?? payload.title ?? payload.displayName ?? id },
  };
}

const NOW = "2026-07-13T16:00:00.000Z";
const EARLIER = "2026-07-12T14:00:00.000Z";

export function buildCrmCatalog(
  provider: CrmProvider,
  organizationId = "org-crm-demo"
): CrmRawEntity[] {
  const p = provider === "hubspot" ? "hs" : "sf";
  const dealType: CrmObjectType = provider === "salesforce" ? "opportunity" : "deal";
  return [
    entity(provider, "lead", `${p}-lead-1`, organizationId, 1, {
      name: "Casey Prospect",
      email: "casey@prospect.edu",
      companyId: `${p}-co-1`,
      status: "open",
      source: "website",
      ownerId: `${p}-owner-1`,
    }, EARLIER),
    entity(provider, "lead", `${p}-lead-2`, organizationId, 1, {
      name: "Riley Referral",
      email: "riley@partner.org",
      companyId: `${p}-co-2`,
      status: "qualified",
      source: "referral",
      ownerId: `${p}-owner-1`,
      convertedContactId: `${p}-contact-2`,
    }, NOW),
    entity(provider, "contact", `${p}-contact-1`, organizationId, 1, {
      name: "Jordan Parent",
      email: "jordan@example.edu",
      companyId: `${p}-co-1`,
      title: "Parent",
      ownerId: `${p}-owner-1`,
    }, EARLIER),
    entity(provider, "contact", `${p}-contact-2`, organizationId, 1, {
      name: "Alex Counselor",
      email: "alex@partner.org",
      companyId: `${p}-co-2`,
      title: "Counselor",
      ownerId: `${p}-owner-2`,
    }, EARLIER),
    entity(provider, "company", `${p}-co-1`, organizationId, 1, {
      name: "Northside Family",
      industry: "Education",
      domain: "example.edu",
      ownerId: `${p}-owner-1`,
    }, EARLIER),
    entity(provider, "company", `${p}-co-2`, organizationId, 1, {
      name: "Partner District",
      industry: "Government",
      domain: "partner.org",
      ownerId: `${p}-owner-2`,
    }, EARLIER),
    entity(provider, "company", `${p}-co-3`, organizationId, 1, {
      name: "Westside Academy",
      industry: "Education",
      domain: "westside.edu",
      ownerId: `${p}-owner-1`,
    }, EARLIER),
    entity(provider, "pipeline", `${p}-pipe-1`, organizationId, 1, {
      name: "Admissions Pipeline",
      stages: ["Inquiry", "Tour", "Application", "Enrolled"],
    }, EARLIER),
    entity(provider, dealType, `${p}-deal-1`, organizationId, 1, {
      name: "Fall enrollment",
      companyId: `${p}-co-1`,
      contactId: `${p}-contact-1`,
      pipelineId: `${p}-pipe-1`,
      amount: 18500,
      stage: "Application",
      probability: 0.65,
      ownerId: `${p}-owner-1`,
      source: "website",
    }, NOW),
    entity(provider, dealType, `${p}-deal-2`, organizationId, 1, {
      name: "Partnership renewal",
      companyId: `${p}-co-2`,
      contactId: `${p}-contact-2`,
      pipelineId: `${p}-pipe-1`,
      amount: 42000,
      stage: "Tour",
      probability: 0.4,
      ownerId: `${p}-owner-2`,
      source: "referral",
    }, EARLIER),
    entity(provider, dealType, `${p}-deal-3`, organizationId, 1, {
      name: "Sibling enrollment",
      companyId: `${p}-co-1`,
      contactId: `${p}-contact-1`,
      pipelineId: `${p}-pipe-1`,
      amount: 12000,
      stage: "Inquiry",
      probability: 0.25,
      ownerId: `${p}-owner-1`,
      source: "website",
    }, EARLIER),
    entity(provider, "activity", `${p}-act-1`, organizationId, 1, {
      name: "Campus tour completed",
      contactId: `${p}-contact-1`,
      dealId: dealType === "deal" ? `${p}-deal-1` : undefined,
      opportunityId: dealType === "opportunity" ? `${p}-deal-1` : undefined,
      activityType: "meeting",
      ownerId: `${p}-owner-1`,
    }, NOW),
    entity(provider, "activity", `${p}-act-2`, organizationId, 1, {
      name: "Follow-up call",
      contactId: `${p}-contact-2`,
      companyId: `${p}-co-2`,
      activityType: "call",
      ownerId: `${p}-owner-2`,
    }, EARLIER),
  ];
}

export function crmCatalogForProvider(
  provider: CrmProvider,
  organizationId?: string
): CrmRawEntity[] {
  return buildCrmCatalog(provider, organizationId);
}

export function objectTypesForCrmProvider(provider: CrmProvider): CrmObjectType[] {
  if (provider === "salesforce") {
    return ["lead", "contact", "company", "opportunity", "activity", "pipeline"];
  }
  return ["lead", "contact", "company", "deal", "activity", "pipeline"];
}
