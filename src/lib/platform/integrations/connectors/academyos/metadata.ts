import type { ConnectorMetadata } from "@/lib/platform/integrations/common/types";
import { ACADEMYOS_OBJECT_TYPES } from "./entities";

export const academyOsMetadata: ConnectorMetadata = {
  id: "academyos",
  name: "AcademyOS",
  description:
    "Production SIS connector — organizations, campuses, students, staff, enrollment, finance, and ops.",
  vendor: "AcademyOS",
  category: "education",
  authMethods: ["api_key", "oauth2"],
  supportsWebhook: true,
  supportsIncremental: true,
  supportsFullSync: true,
  supportsPolling: true,
  objectTypes: [...ACADEMYOS_OBJECT_TYPES],
  version: "1.0.0",
  docsUrl: "/docs/product/ACADEMYOS_CONNECTOR.md",
  placeholder: false,
};
