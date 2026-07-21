/**
 * Thin provider factories + B4 metadata for all Sprint 078 enterprise connectors.
 */

import type { ConnectorMetadata } from "@/lib/platform/integrations/common/types";
import type { EventPublisher } from "@/lib/platform/integrations/events/publisher";
import type { EnterpriseProvider } from "@/lib/platform/integrations/connectors/enterprise/entities";
import { PROVIDER_DOMAIN } from "@/lib/platform/integrations/connectors/enterprise/entities";
import { objectTypesForProvider } from "@/lib/platform/integrations/connectors/enterprise/services/demo-catalog";
import {
  createEnterprisePlatformConnector,
  reconnectEnterpriseConnector,
  type EnterpriseConnectorSpec,
} from "@/lib/platform/integrations/connectors/enterprise/services/platform-connector";
import type { EnterpriseClient } from "@/lib/platform/integrations/connectors/enterprise/services/client";
import { createDemoEnterpriseClient } from "@/lib/platform/integrations/connectors/enterprise/services/client";

type ProviderDef = {
  provider: EnterpriseProvider;
  displayName: string;
  vendor: string;
  description: string;
  category: ConnectorMetadata["category"];
  capabilities: readonly string[];
};

const DEFS: readonly ProviderDef[] = [
  {
    provider: "state_education",
    displayName: "State Education API",
    vendor: "State",
    description: "Government adapter — state education reporting into canonical entities.",
    category: "other",
    capabilities: ["programs", "compliance", "students", "attendance"],
  },
  {
    provider: "scholarship",
    displayName: "Scholarship Systems",
    vendor: "Scholarship",
    description: "Government adapter — scholarship programs, applications, and awards.",
    category: "other",
    capabilities: ["programs", "applications", "awards", "students"],
  },
  {
    provider: "medicaid",
    displayName: "Medicaid",
    vendor: "HHS",
    description: "Government adapter — Medicaid programs, claims, and compliance.",
    category: "other",
    capabilities: ["programs", "claims", "compliance"],
  },
  {
    provider: "grant",
    displayName: "Grant Systems",
    vendor: "Grants",
    description: "Government adapter — grant programs, applications, awards, and compliance.",
    category: "other",
    capabilities: ["programs", "applications", "awards", "compliance"],
  },
];

function toMetadata(def: ProviderDef): ConnectorMetadata {
  return {
    id: def.provider,
    name: def.displayName,
    description: def.description,
    vendor: def.vendor,
    category: def.category,
    authMethods: ["oauth2", "api_key"],
    supportsWebhook: true,
    supportsIncremental: true,
    supportsFullSync: true,
    supportsPolling: true,
    objectTypes: [...objectTypesForProvider(def.provider)],
    version: "1.0.0",
    placeholder: false,
  };
}

function toSpec(def: ProviderDef): EnterpriseConnectorSpec {
  return {
    provider: def.provider,
    displayName: def.displayName,
    description: def.description,
    capabilities: def.capabilities,
  };
}

const BY_PROVIDER = Object.fromEntries(DEFS.map((d) => [d.provider, d])) as Record<
  EnterpriseProvider,
  ProviderDef
>;

/** RC-3.04 — CRM metadata lives in connectors/crm; re-exported for Sprint 078 import paths. */
export {
  hubspotMetadata,
  salesforceMetadata,
} from "@/lib/platform/integrations/connectors/crm/providers";

/** RC-3.06 — Education metadata lives in connectors/education. */
export {
  canvasMetadata,
  powerschoolMetadata,
  googleClassroomMetadata,
} from "@/lib/platform/integrations/connectors/education/providers";

export const stateEducationMetadata = toMetadata(BY_PROVIDER.state_education);
export const scholarshipMetadata = toMetadata(BY_PROVIDER.scholarship);
export const medicaidMetadata = toMetadata(BY_PROVIDER.medicaid);
export const grantMetadata = toMetadata(BY_PROVIDER.grant);

/** RC-3.05 — HR metadata lives in connectors/hr; re-exported for Sprint 078 import paths. */
export {
  adpMetadata,
  gustoMetadata,
  paylocityMetadata,
} from "@/lib/platform/integrations/connectors/hr/providers";

export const ENTERPRISE_B4_METADATA: readonly ConnectorMetadata[] = [
  stateEducationMetadata,
  scholarshipMetadata,
  medicaidMetadata,
  grantMetadata,
];

export function createEnterpriseProviderPlatformConnector(
  provider: EnterpriseProvider,
  options: { client?: EnterpriseClient; publisher?: EventPublisher } = {}
) {
  return createEnterprisePlatformConnector(toSpec(BY_PROVIDER[provider]), options);
}

/** @deprecated Prefer createHubspotPlatformConnector from connectors/crm */
export { createHubspotPlatformConnector } from "@/lib/platform/integrations/connectors/crm/providers";

/** @deprecated Prefer createSalesforcePlatformConnector from connectors/crm */
export { createSalesforcePlatformConnector } from "@/lib/platform/integrations/connectors/crm/providers";

/** @deprecated Prefer createGustoPlatformConnector from connectors/hr */
export { createGustoPlatformConnector } from "@/lib/platform/integrations/connectors/hr/providers";

export function createDemoEnterpriseProviderClient(provider: EnterpriseProvider) {
  return createDemoEnterpriseClient(provider);
}

export { reconnectEnterpriseConnector, PROVIDER_DOMAIN };
