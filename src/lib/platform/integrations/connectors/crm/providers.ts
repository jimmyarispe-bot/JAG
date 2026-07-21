/**
 * CRM provider factories + B4 metadata — HubSpot, Salesforce.
 */

import type { ConnectorMetadata } from "@/lib/platform/integrations/common/types";
import type { EventPublisher } from "@/lib/platform/integrations/events/publisher";
import type { CrmProvider } from "@/lib/platform/integrations/connectors/crm/entities";
import { objectTypesForCrmProvider } from "@/lib/platform/integrations/connectors/crm/services/demo-catalog";
import {
  createCrmPlatformConnector,
  reconnectCrmConnector,
  type CrmConnectorSpec,
} from "@/lib/platform/integrations/connectors/crm/services/platform-connector";
import {
  createDemoCrmClient,
  type CrmClient,
} from "@/lib/platform/integrations/connectors/crm/services/client";

type ProviderDef = {
  provider: CrmProvider;
  displayName: string;
  vendor: string;
  description: string;
  capabilities: readonly string[];
};

const DEFS: readonly ProviderDef[] = [
  {
    provider: "hubspot",
    displayName: "HubSpot",
    vendor: "HubSpot",
    description:
      "CRM — leads, contacts, companies, deals, activities, and pipelines.",
    capabilities: [
      "leads",
      "contacts",
      "companies",
      "deals",
      "activities",
      "pipelines",
    ],
  },
  {
    provider: "salesforce",
    displayName: "Salesforce",
    vendor: "Salesforce",
    description:
      "CRM — leads, contacts, companies, opportunities, activities, and pipelines.",
    capabilities: [
      "leads",
      "contacts",
      "companies",
      "opportunities",
      "activities",
      "pipelines",
    ],
  },
];

function toMetadata(def: ProviderDef): ConnectorMetadata {
  return {
    id: def.provider,
    name: def.displayName,
    description: def.description,
    vendor: def.vendor,
    category: "crm",
    authMethods: ["oauth2", "api_key"],
    supportsWebhook: true,
    supportsIncremental: true,
    supportsFullSync: true,
    supportsPolling: true,
    objectTypes: [...objectTypesForCrmProvider(def.provider)],
    version: "1.1.0",
    placeholder: false,
  };
}

function toSpec(def: ProviderDef): CrmConnectorSpec {
  return {
    provider: def.provider,
    displayName: def.displayName,
    description: def.description,
    version: "1.1.0",
    capabilities: def.capabilities,
  };
}

const BY_PROVIDER = Object.fromEntries(DEFS.map((d) => [d.provider, d])) as Record<
  CrmProvider,
  ProviderDef
>;

export const hubspotMetadata = toMetadata(BY_PROVIDER.hubspot);
export const salesforceMetadata = toMetadata(BY_PROVIDER.salesforce);

export const CRM_B4_METADATA: readonly ConnectorMetadata[] = [
  hubspotMetadata,
  salesforceMetadata,
];

export function createCrmProviderPlatformConnector(
  provider: CrmProvider,
  options: { client?: CrmClient; publisher?: EventPublisher } = {}
) {
  return createCrmPlatformConnector(toSpec(BY_PROVIDER[provider]), options);
}

export function createHubspotPlatformConnector(options?: {
  client?: CrmClient;
  publisher?: EventPublisher;
}) {
  return createCrmProviderPlatformConnector("hubspot", options);
}

export function createSalesforcePlatformConnector(options?: {
  client?: CrmClient;
  publisher?: EventPublisher;
}) {
  return createCrmProviderPlatformConnector("salesforce", options);
}

export function createDemoCrmProviderClient(provider: CrmProvider) {
  return createDemoCrmClient(provider);
}

export { reconnectCrmConnector };
