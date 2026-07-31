import {
  ACADEMYOS_APPLICATION_ID,
  ACADEMYOS_VERSION,
} from "@/applications/academyos/manifest";
import {
  loadAcademyEnvironment,
  type AcademyEnvironment,
} from "@/applications/academyos/configuration/environment";
import {
  loadAcademyFeatures,
  type AcademyFeatureFlags,
} from "@/applications/academyos/configuration/features";

export type AcademyApplicationMetadata = {
  applicationId: string;
  name: string;
  version: string;
  homeRoute: string;
  compositionPhase: "composition";
};

export type AcademyConfiguration = {
  metadata: AcademyApplicationMetadata;
  environment: AcademyEnvironment;
  features: AcademyFeatureFlags;
  defaults: {
    pageSize: number;
    currencyCode: string;
    timezone: string;
  };
};

export type AcademyConfigurationOverrides = {
  environment?: Partial<AcademyEnvironment>;
  features?: Partial<AcademyFeatureFlags>;
  defaults?: Partial<AcademyConfiguration["defaults"]>;
};

export function loadAcademyConfiguration(
  overrides?: AcademyConfigurationOverrides
): AcademyConfiguration {
  return {
    metadata: {
      applicationId: ACADEMYOS_APPLICATION_ID,
      name: "AcademyOS",
      version: ACADEMYOS_VERSION,
      homeRoute: "/academyos",
      compositionPhase: "composition",
    },
    environment: loadAcademyEnvironment(overrides?.environment),
    features: loadAcademyFeatures(overrides?.features),
    defaults: {
      pageSize: 50,
      currencyCode: "USD",
      timezone: "America/New_York",
      ...overrides?.defaults,
    },
  };
}
