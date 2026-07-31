/**
 * Platform SDK™ — composition root for registries, extensions, and validation.
 */

import { createGoogleWorkspacePlatformConnector } from "@/lib/platform-sdk/connectors/google-workspace";
import { createQuickBooksPlatformConnector } from "@/lib/platform-sdk/connectors/quickbooks";
import { createSdkEventPublisher } from "@/lib/platform-sdk/events/bridge";
import { createExtensionRegistry } from "@/lib/platform-sdk/registry/extension-registry";
import { createPlatformSdkRegistry } from "@/lib/platform-sdk/registry/platform-registry";
import { createCompatibilityValidator } from "@/lib/platform-sdk/validation/compatibility";
import {
  createBasicEvidenceValidator,
  validateDecisionSource,
  validateEvidenceProvider,
  validateInsightProvider,
  validatePlatformConnector,
  validateTwinEntityDescriptor,
} from "@/lib/platform-sdk/validation/providers";
import {
  PLATFORM_SDK_INFO,
  PLATFORM_SDK_VERSION,
} from "@/lib/platform-sdk/versioning";
import { JAG_PLATFORM_VERSION } from "@/lib/jag-platform/versioning";
import { TWIN_ENTITY_TYPES } from "@/lib/digital-twin/types";

export type PlatformSdk = {
  readonly version: typeof PLATFORM_SDK_VERSION;
  readonly platformVersion: string;
  readonly registry: ReturnType<typeof createPlatformSdkRegistry>;
  readonly extensions: ReturnType<typeof createExtensionRegistry>;
  readonly compatibility: ReturnType<typeof createCompatibilityValidator>;
  readonly events: ReturnType<typeof createSdkEventPublisher>;
  listInterfaces(): readonly {
    readonly name: string;
    readonly module: string;
  }[];
  getDeveloperSnapshot(organizationId: string): {
    readonly sdkVersion: string;
    readonly platformVersion: string;
    readonly installedExtensions: ReturnType<
      ReturnType<typeof createExtensionRegistry>["listInstalled"]
    >;
    readonly interfaces: ReturnType<PlatformSdk["listInterfaces"]>;
    readonly connectors: ReturnType<
      ReturnType<typeof createPlatformSdkRegistry>["listConnectors"]
    >;
    readonly twinEntityTypes: ReturnType<
      ReturnType<typeof createPlatformSdkRegistry>["listTwinEntityTypes"]
    >;
    readonly insightProviders: ReturnType<
      ReturnType<typeof createPlatformSdkRegistry>["listInsightProviders"]
    >;
    readonly decisionProviders: ReturnType<
      ReturnType<typeof createPlatformSdkRegistry>["listDecisionSources"]
    >;
    readonly evidenceProviders: ReturnType<
      ReturnType<typeof createPlatformSdkRegistry>["listEvidenceProviders"]
    >;
    readonly validationResults: readonly {
      readonly target: string;
      readonly ok: boolean;
      readonly errors: readonly string[];
    }[];
  };
};

function bootstrapDefaults(
  registry: ReturnType<typeof createPlatformSdkRegistry>
): void {
  if (registry.listConnectors().length === 0) {
    registry.registerConnector(createQuickBooksPlatformConnector());
    registry.registerConnector(createGoogleWorkspacePlatformConnector());
  }
  if (registry.listTwinEntityTypes().length === 0) {
    for (const entityType of TWIN_ENTITY_TYPES) {
      registry.registerTwinEntityType({
        entityType,
        version: "1.0.0",
        description: `Canonical Digital Twin™ entity: ${entityType}`,
      });
    }
  }
}

export function createPlatformSdk(options?: {
  bootstrap?: boolean;
}): PlatformSdk {
  const registry = createPlatformSdkRegistry();
  const extensions = createExtensionRegistry();
  const compatibility = createCompatibilityValidator();
  const events = createSdkEventPublisher();

  if (options?.bootstrap !== false) {
    bootstrapDefaults(registry);
  }

  const sdk: PlatformSdk = {
    version: PLATFORM_SDK_VERSION,
    platformVersion: JAG_PLATFORM_VERSION.platformVersion,
    registry,
    extensions,
    compatibility,
    events,

    listInterfaces() {
      return Object.freeze([
        { name: "PlatformConnector", module: "connectors" },
        { name: "TwinEntity", module: "digital-twin" },
        { name: "TwinRelationship", module: "digital-twin" },
        { name: "TwinLifecycle", module: "digital-twin" },
        { name: "TwinValidation", module: "digital-twin" },
        { name: "TwinMetrics", module: "digital-twin" },
        { name: "EvidenceProvider", module: "evidence" },
        { name: "EvidenceProcessor", module: "evidence" },
        { name: "EvidenceValidator", module: "evidence" },
        { name: "EvidenceMapper", module: "evidence" },
        { name: "InsightProvider", module: "executive" },
        { name: "InsightRule", module: "executive" },
        { name: "InsightEvaluator", module: "executive" },
        { name: "InsightFormatter", module: "executive" },
        { name: "DecisionSource", module: "decisions" },
        { name: "DecisionWorkflow", module: "decisions" },
        { name: "DecisionAssignment", module: "decisions" },
        { name: "DecisionPolicy", module: "decisions" },
        { name: "PlatformEvent", module: "events" },
        { name: "EventPublisher", module: "events" },
        { name: "EventSubscriber", module: "events" },
        { name: "EventHandler", module: "events" },
        { name: "EventEnvelope", module: "events" },
        { name: "PermissionDefinition", module: "permissions" },
        { name: "ExtensionManifest", module: "extensions" },
        { name: "ExtensionLifecycle", module: "lifecycle" },
        { name: "CompatibilityValidator", module: "validation" },
      ]);
    },

    getDeveloperSnapshot(organizationId) {
      const connectors = registry.listConnectors();
      const evidence = registry.listEvidenceProviders();
      const insights = registry.listInsightProviders();
      const decisions = registry.listDecisionSources();
      const twinTypes = registry.listTwinEntityTypes();
      const installed = extensions.listInstalled(organizationId);

      const validationResults = [
        ...connectors.map((c) => ({
          target: `connector:${c.id}`,
          ...validatePlatformConnector(c),
        })),
        ...evidence.map((p) => ({
          target: `evidence:${p.id}`,
          ...validateEvidenceProvider(p),
        })),
        ...insights.map((p) => ({
          target: `insight:${p.id}`,
          ...validateInsightProvider(p),
        })),
        ...decisions.map((s) => ({
          target: `decision:${s.id}`,
          ...validateDecisionSource(s),
        })),
        ...installed.map((ext) => {
          const result = extensions.lifecycle.validate(
            organizationId,
            ext.manifest.id
          );
          return {
            target: `extension:${ext.manifest.id}`,
            ok: result.ok,
            errors: result.errors,
          };
        }),
        {
          target: "twin:sample-descriptor",
          ...(() => {
            const result = validateTwinEntityDescriptor({
              id: "sample",
              organizationId,
              entityType: "Organization",
              label: "Sample",
              status: "Active",
              externalKey: "sample",
              metadata: {},
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
            return result.ok
              ? { ok: true as const, errors: [] as const }
              : {
                  ok: false as const,
                  errors: Object.freeze([result.error]) as readonly string[],
                };
          })(),
        },
        {
          target: "evidence:basic-validator",
          ...(() => {
            const v = createBasicEvidenceValidator().validate({
              id: "e1",
              organizationId,
              title: "Sample",
              domain: "General",
              source: "sdk",
              status: "Active",
              createdAt: new Date().toISOString(),
            });
            return v.ok
              ? { ok: true as const, errors: [] as const }
              : {
                  ok: false as const,
                  errors: Object.freeze([v.error]) as readonly string[],
                };
          })(),
        },
      ];

      return {
        sdkVersion: PLATFORM_SDK_INFO.sdkVersion,
        platformVersion: JAG_PLATFORM_VERSION.platformVersion,
        installedExtensions: installed,
        interfaces: sdk.listInterfaces(),
        connectors,
        twinEntityTypes: twinTypes,
        insightProviders: insights,
        decisionProviders: decisions,
        evidenceProviders: evidence,
        validationResults: Object.freeze(validationResults),
      };
    },
  };

  return sdk;
}

let singleton: PlatformSdk | null = null;

export function getPlatformSdk(): PlatformSdk {
  if (!singleton) singleton = createPlatformSdk();
  return singleton;
}

export function resetPlatformSdkForTests(): void {
  singleton = null;
}
