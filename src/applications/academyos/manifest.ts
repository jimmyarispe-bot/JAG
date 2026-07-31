import { ACADEMYOS_ENDPOINTS } from "@/applications/academyos/api/endpoints";
import { ACADEMYOS_FORMS } from "@/applications/academyos/forms/definitions";
import { ACADEMYOS_PERMISSION_KEYS } from "@/applications/academyos/permissions/roles";
import { ACADEMYOS_SCHEMAS } from "@/applications/academyos/schemas/definitions";
import { ACADEMYOS_WORKFLOWS } from "@/applications/academyos/workflows/definitions";
import { emptyManifest, type ApplicationManifest } from "@/lib/platform/sdk";

export const ACADEMYOS_APPLICATION_ID = "academyos";
export const ACADEMYOS_VERSION = "1.1.0";

/**
 * Single AcademyOS application contract — SDK only.
 */
export function createAcademyOSManifest(): ApplicationManifest {
  return emptyManifest({
    id: ACADEMYOS_APPLICATION_ID,
    name: "AcademyOS",
    version: ACADEMYOS_VERSION,
    description:
      "Education operating system plug-in for JAG — schools, students, learning, finance, and HR.",
    capabilities: [
      "schemas",
      "entities",
      "forms",
      "workflows",
      "apis",
      "permissions",
      "graph",
      "forecasting",
      "decisions",
      "notifications",
    ],
    schemas: ACADEMYOS_SCHEMAS.map((s) => ({
      schemaId: s.id,
      version: s.version,
    })),
    entities: ACADEMYOS_SCHEMAS.map((s) => ({ entityType: s.entityType })),
    forms: ACADEMYOS_FORMS.map((f) => ({ formId: f.id, version: f.version })),
    workflows: ACADEMYOS_WORKFLOWS.map((w) => ({
      workflowId: w.id,
      version: w.version,
    })),
    apis: ACADEMYOS_ENDPOINTS.map((e) => ({
      endpointId: e.id,
      version: e.version,
    })),
    permissions: ACADEMYOS_PERMISSION_KEYS.map((permission) => ({
      permission,
    })),
    automation: [],
    dependencies: [],
    extensions: [
      {
        id: "academyos.nav",
        extensionPoint: "graph.node",
        version: "1.0.0",
        metadata: { kind: "navigation" },
      },
    ],
    compatibility: {
      minPlatformVersion: "0.78.0",
      maxTestedPlatformVersion: "0.78.0",
      notes:
        "AcademyOS Phase 4 production infrastructure — persistence classes + startup health; no production UI",
    },
    metadata: {
      navigationId: "academyos.main",
      homeRoute: "/academyos",
      applicationKey: "academyos",
      phase: "production-infrastructure",
    },
  });
}

/** Stable export used by bootstrap and docs. */
export const AcademyOSManifest: ApplicationManifest = createAcademyOSManifest();
