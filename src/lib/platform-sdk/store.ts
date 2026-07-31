import type { PlatformConnectorRegistration } from "@/lib/platform-sdk/connectors/types";
import type { DecisionProviderRegistration } from "@/lib/platform-sdk/decisions/types";
import type { TwinEntityTypeRegistration } from "@/lib/platform-sdk/digital-twin/types";
import type { EvidenceProviderRegistration } from "@/lib/platform-sdk/evidence/types";
import type { ExtensionManifest, ExtensionRecord } from "@/lib/platform-sdk/extensions/types";
import type { InsightProviderRegistration } from "@/lib/platform-sdk/executive/types";

type PlatformSdkStore = {
  connectors: Map<string, PlatformConnectorRegistration>;
  twinEntityTypes: Map<string, TwinEntityTypeRegistration>;
  evidenceProviders: Map<string, EvidenceProviderRegistration>;
  insightProviders: Map<string, InsightProviderRegistration>;
  decisionProviders: Map<string, DecisionProviderRegistration>;
  /** Available extension manifests (catalog). */
  extensionCatalog: Map<string, ExtensionManifest>;
  /** Per-org installed extensions: orgId::extensionId */
  extensions: Map<string, ExtensionRecord>;
};

const g = globalThis as typeof globalThis & {
  __jagPlatformSdkStore?: PlatformSdkStore;
};

function store(): PlatformSdkStore {
  if (!g.__jagPlatformSdkStore) {
    g.__jagPlatformSdkStore = {
      connectors: new Map(),
      twinEntityTypes: new Map(),
      evidenceProviders: new Map(),
      insightProviders: new Map(),
      decisionProviders: new Map(),
      extensionCatalog: new Map(),
      extensions: new Map(),
    };
  }
  return g.__jagPlatformSdkStore;
}

export function resetPlatformSdkStoreForTests(): void {
  g.__jagPlatformSdkStore = {
    connectors: new Map(),
    twinEntityTypes: new Map(),
    evidenceProviders: new Map(),
    insightProviders: new Map(),
    decisionProviders: new Map(),
    extensionCatalog: new Map(),
    extensions: new Map(),
  };
}

export function orgExtKey(organizationId: string, extensionId: string): string {
  return `${organizationId}::${extensionId}`;
}

export { store };
