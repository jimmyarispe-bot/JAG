/**
 * HR provider factories + B4 metadata — ADP, Gusto, Paylocity, BambooHR.
 */

import type { ConnectorMetadata } from "@/lib/platform/integrations/common/types";
import type { EventPublisher } from "@/lib/platform/integrations/events/publisher";
import type { HrProvider } from "@/lib/platform/integrations/connectors/hr/entities";
import { objectTypesForHrProvider } from "@/lib/platform/integrations/connectors/hr/services/demo-catalog";
import {
  createHrPlatformConnector,
  reconnectHrConnector,
  type HrConnectorSpec,
} from "@/lib/platform/integrations/connectors/hr/services/platform-connector";
import {
  createDemoHrClient,
  type HrClient,
} from "@/lib/platform/integrations/connectors/hr/services/client";

type ProviderDef = {
  provider: HrProvider;
  displayName: string;
  vendor: string;
  description: string;
  capabilities: readonly string[];
};

const DEFS: readonly ProviderDef[] = [
  {
    provider: "adp",
    displayName: "ADP",
    vendor: "ADP",
    description:
      "HR — employees, payroll, benefits, time off, departments, managers, and hiring.",
    capabilities: [
      "employees",
      "payroll",
      "benefits",
      "time_off",
      "departments",
      "managers",
      "hiring",
    ],
  },
  {
    provider: "gusto",
    displayName: "Gusto",
    vendor: "Gusto",
    description:
      "HR — employees, payroll, benefits, time off, departments, managers, and hiring.",
    capabilities: [
      "employees",
      "payroll",
      "benefits",
      "time_off",
      "departments",
      "managers",
      "hiring",
    ],
  },
  {
    provider: "paylocity",
    displayName: "Paylocity",
    vendor: "Paylocity",
    description:
      "HR — employees, payroll, benefits, time off, departments, managers, and hiring.",
    capabilities: [
      "employees",
      "payroll",
      "benefits",
      "time_off",
      "departments",
      "managers",
      "hiring",
    ],
  },
  {
    provider: "bamboohr",
    displayName: "BambooHR",
    vendor: "BambooHR",
    description:
      "HRIS — employees, payroll, benefits, time off, departments, managers, and hiring.",
    capabilities: [
      "employees",
      "payroll",
      "benefits",
      "time_off",
      "departments",
      "managers",
      "hiring",
    ],
  },
];

function toMetadata(def: ProviderDef): ConnectorMetadata {
  return {
    id: def.provider,
    name: def.displayName,
    description: def.description,
    vendor: def.vendor,
    category: "hr",
    authMethods: ["oauth2", "api_key"],
    supportsWebhook: true,
    supportsIncremental: true,
    supportsFullSync: true,
    supportsPolling: true,
    objectTypes: [...objectTypesForHrProvider(def.provider)],
    version: "1.1.0",
    placeholder: false,
  };
}

function toSpec(def: ProviderDef): HrConnectorSpec {
  return {
    provider: def.provider,
    displayName: def.displayName,
    description: def.description,
    version: "1.1.0",
    capabilities: def.capabilities,
  };
}

const BY_PROVIDER = Object.fromEntries(DEFS.map((d) => [d.provider, d])) as Record<
  HrProvider,
  ProviderDef
>;

export const adpMetadata = toMetadata(BY_PROVIDER.adp);
export const gustoMetadata = toMetadata(BY_PROVIDER.gusto);
export const paylocityMetadata = toMetadata(BY_PROVIDER.paylocity);
export const bambooHrMetadata = toMetadata(BY_PROVIDER.bamboohr);

export const HR_B4_METADATA: readonly ConnectorMetadata[] = [
  adpMetadata,
  gustoMetadata,
  paylocityMetadata,
  bambooHrMetadata,
];

export function createHrProviderPlatformConnector(
  provider: HrProvider,
  options: { client?: HrClient; publisher?: EventPublisher } = {}
) {
  return createHrPlatformConnector(toSpec(BY_PROVIDER[provider]), options);
}

export function createAdpPlatformConnector(options?: {
  client?: HrClient;
  publisher?: EventPublisher;
}) {
  return createHrProviderPlatformConnector("adp", options);
}

export function createGustoPlatformConnector(options?: {
  client?: HrClient;
  publisher?: EventPublisher;
}) {
  return createHrProviderPlatformConnector("gusto", options);
}

export function createPaylocityPlatformConnector(options?: {
  client?: HrClient;
  publisher?: EventPublisher;
}) {
  return createHrProviderPlatformConnector("paylocity", options);
}

export function createBambooHrPlatformConnector(options?: {
  client?: HrClient;
  publisher?: EventPublisher;
}) {
  return createHrProviderPlatformConnector("bamboohr", options);
}

export function createDemoHrProviderClient(provider: HrProvider) {
  return createDemoHrClient(provider);
}

export { reconnectHrConnector };
