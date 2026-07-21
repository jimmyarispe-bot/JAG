/**
 * Education provider factories + B4 metadata — Canvas, PowerSchool, Google Classroom.
 */

import type { ConnectorMetadata } from "@/lib/platform/integrations/common/types";
import type { EventPublisher } from "@/lib/platform/integrations/events/publisher";
import type { EducationProvider } from "@/lib/platform/integrations/connectors/education/entities";
import { objectTypesForEducationProvider } from "@/lib/platform/integrations/connectors/education/services/demo-catalog";
import {
  createEducationPlatformConnector,
  reconnectEducationConnector,
  type EducationConnectorSpec,
} from "@/lib/platform/integrations/connectors/education/services/platform-connector";
import {
  createDemoEducationClient,
  type EducationClient,
} from "@/lib/platform/integrations/connectors/education/services/client";

type ProviderDef = {
  provider: EducationProvider;
  displayName: string;
  vendor: string;
  description: string;
  capabilities: readonly string[];
};

const DEFS: readonly ProviderDef[] = [
  {
    provider: "canvas",
    displayName: "Canvas",
    vendor: "Instructure",
    description:
      "Education — students, teachers, courses, assignments, grades, attendance, and schedules.",
    capabilities: [
      "students",
      "teachers",
      "courses",
      "assignments",
      "grades",
      "attendance",
      "schedules",
    ],
  },
  {
    provider: "powerschool",
    displayName: "PowerSchool",
    vendor: "PowerSchool",
    description:
      "Education — students, teachers, courses, assignments, grades, attendance, and schedules.",
    capabilities: [
      "students",
      "teachers",
      "courses",
      "assignments",
      "grades",
      "attendance",
      "schedules",
    ],
  },
  {
    provider: "google_classroom",
    displayName: "Google Classroom",
    vendor: "Google",
    description:
      "Education — students, teachers, courses, assignments, grades, attendance, and schedules.",
    capabilities: [
      "students",
      "teachers",
      "courses",
      "assignments",
      "grades",
      "attendance",
      "schedules",
    ],
  },
];

function toMetadata(def: ProviderDef): ConnectorMetadata {
  return {
    id: def.provider,
    name: def.displayName,
    description: def.description,
    vendor: def.vendor,
    category: "education",
    authMethods: ["oauth2", "api_key"],
    supportsWebhook: true,
    supportsIncremental: true,
    supportsFullSync: true,
    supportsPolling: true,
    objectTypes: [...objectTypesForEducationProvider(def.provider)],
    version: "1.1.0",
    placeholder: false,
  };
}

function toSpec(def: ProviderDef): EducationConnectorSpec {
  return {
    provider: def.provider,
    displayName: def.displayName,
    description: def.description,
    version: "1.1.0",
    capabilities: def.capabilities,
  };
}

const BY_PROVIDER = Object.fromEntries(DEFS.map((d) => [d.provider, d])) as Record<
  EducationProvider,
  ProviderDef
>;

export const canvasMetadata = toMetadata(BY_PROVIDER.canvas);
export const powerschoolMetadata = toMetadata(BY_PROVIDER.powerschool);
export const googleClassroomMetadata = toMetadata(BY_PROVIDER.google_classroom);

export const EDUCATION_B4_METADATA: readonly ConnectorMetadata[] = [
  canvasMetadata,
  powerschoolMetadata,
  googleClassroomMetadata,
];

export function createEducationProviderPlatformConnector(
  provider: EducationProvider,
  options: { client?: EducationClient; publisher?: EventPublisher } = {}
) {
  return createEducationPlatformConnector(toSpec(BY_PROVIDER[provider]), options);
}

export function createCanvasPlatformConnector(options?: {
  client?: EducationClient;
  publisher?: EventPublisher;
}) {
  return createEducationProviderPlatformConnector("canvas", options);
}

export function createPowerschoolPlatformConnector(options?: {
  client?: EducationClient;
  publisher?: EventPublisher;
}) {
  return createEducationProviderPlatformConnector("powerschool", options);
}

export function createGoogleClassroomPlatformConnector(options?: {
  client?: EducationClient;
  publisher?: EventPublisher;
}) {
  return createEducationProviderPlatformConnector("google_classroom", options);
}

export function createDemoEducationProviderClient(provider: EducationProvider) {
  return createDemoEducationClient(provider);
}

export { reconnectEducationConnector };
