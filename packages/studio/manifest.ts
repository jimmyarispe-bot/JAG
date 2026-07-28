import type { ExtensionManifest } from "@/lib/platform-sdk";
import type { PermissionDefinition } from "@/lib/platform-sdk";

export const STUDIO_PACK_ID = "jag-studio" as const;
export const STUDIO_PACK_VERSION = "1.0.0" as const;

export type JagStudioDescriptor = {
  readonly id: typeof STUDIO_PACK_ID;
  readonly name: "JAG Studio";
  readonly version: typeof STUDIO_PACK_VERSION;
  readonly type: "platform-application";
  readonly modules: readonly string[];
};

export const STUDIO_MODULES = [
  "Architecture",
  "Repository",
  "Products",
  "Release",
  "Testing",
  "PER",
  "Documentation",
  "Insights",
  "Workspaces",
] as const;

export const STUDIO_PACK_DESCRIPTOR: JagStudioDescriptor = Object.freeze({
  id: STUDIO_PACK_ID,
  name: "JAG Studio",
  version: STUDIO_PACK_VERSION,
  type: "platform-application",
  modules: STUDIO_MODULES,
});

const PERMISSIONS: readonly PermissionDefinition[] = Object.freeze([
  {
    id: "studio.read",
    name: "Read JAG Studio",
    description: "View Studio dashboards and indexes",
    scope: "Organization",
    resource: "studio",
    actions: ["read"],
  },
  {
    id: "studio.manage",
    name: "Manage JAG Studio",
    description: "Manage products, releases, and PERs",
    scope: "Organization",
    resource: "studio",
    actions: ["create", "update"],
  },
]);

export const STUDIO_EXTENSION_MANIFEST: ExtensionManifest = Object.freeze({
  id: STUDIO_PACK_ID,
  name: "JAG Studio",
  version: STUDIO_PACK_VERSION,
  category: "Utility",
  description:
    "Internal operating environment to build, inspect, validate, certify, and release JAG industry packs.",
  dependencies: [],
  minimumPlatformVersion: "1.0.0",
  minimumSdkVersion: "1.0.0",
  requiredPermissions: PERMISSIONS,
  digitalTwinEntities: [],
  connectorDependencies: [],
  featureFlags: ["studio.enabled"],
  configurationSchema: {
    type: "object",
    properties: {
      repositoryRoot: {
        type: "string",
        required: false,
        description: "Absolute path override for repository scanning",
      },
    },
  },
});
