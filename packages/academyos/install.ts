/**
 * Install AcademyOS™ through the Platform SDK Extension Framework.
 * No Platform Core modifications.
 */

import { createPlatformSdk, getPlatformSdk } from "@/lib/platform-sdk";
import { createEducationConnectors } from "./connectors/catalog";
import { createAcademyOsInsightProvider } from "./intelligence/insight-provider";
import {
  ACADEMYOS_EXTENSION_MANIFEST,
  ACADEMYOS_PACK_ID,
  ACADEMYOS_TWIN_ENTITY_LABELS,
} from "./manifest";
import { ACADEMYOS_TWIN_MAPPINGS } from "./twin/mappings";

export type AcademyOsInstallResult = {
  readonly extensionId: string;
  readonly status: string;
  readonly enabled: boolean;
  readonly connectorsRegistered: number;
  readonly twinMappings: number;
  readonly insightProviderId: string;
};

/**
 * Register catalog + install + enable AcademyOS for an organization.
 * Also registers pack connectors, twin entity labels, and insight provider on the SDK.
 */
export function installAcademyOsIndustryPack(input: {
  organizationId: string;
  /** When true, uses a fresh SDK instance (tests). Default: shared singleton. */
  freshSdk?: boolean;
}): AcademyOsInstallResult {
  const sdk = input.freshSdk ? createPlatformSdk() : getPlatformSdk();

  sdk.extensions.registerCatalog(ACADEMYOS_EXTENSION_MANIFEST);
  sdk.extensions.lifecycle.install(
    input.organizationId,
    ACADEMYOS_EXTENSION_MANIFEST
  );
  const enabled = sdk.extensions.lifecycle.enable(
    input.organizationId,
    ACADEMYOS_PACK_ID
  );

  for (const label of ACADEMYOS_TWIN_ENTITY_LABELS) {
    sdk.registry.registerTwinEntityType({
      entityType: label,
      version: ACADEMYOS_EXTENSION_MANIFEST.version,
      description: `AcademyOS industry projection — ${label}`,
    });
  }

  const connectors = createEducationConnectors();
  for (const connector of connectors) {
    sdk.registry.registerConnector(connector);
  }

  const insightProvider = createAcademyOsInsightProvider();
  sdk.registry.registerInsightProvider(insightProvider);

  return {
    extensionId: enabled.manifest.id,
    status: enabled.status,
    enabled: enabled.enabled,
    connectorsRegistered: connectors.length,
    twinMappings: ACADEMYOS_TWIN_MAPPINGS.length,
    insightProviderId: insightProvider.id,
  };
}

export function getAcademyOsInstallRecord(organizationId: string) {
  return getPlatformSdk().extensions.get(organizationId, ACADEMYOS_PACK_ID);
}
