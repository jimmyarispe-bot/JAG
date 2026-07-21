/**
 * SDK Extensions Marketplace — soft-read language/package catalog (no code gen side effects).
 */

import type { MarketplaceListing } from "@/lib/platform/marketplace/types";
import { MARKETPLACE_VERSION } from "@/lib/platform/marketplace/types";

const SDK_PACKAGES: Array<{
  key: string;
  name: string;
  description: string;
  language: string;
  tags: string[];
}> = [
  {
    key: "typescript_client",
    name: "TypeScript Platform SDK",
    description: "Typed client for soft-read APIs (KG, feeds, marketplace install intents).",
    language: "typescript",
    tags: ["sdk", "typescript"],
  },
  {
    key: "python_client",
    name: "Python Platform SDK",
    description: "Python client for platform soft-reads and workflow studio dry-runs.",
    language: "python",
    tags: ["sdk", "python"],
  },
  {
    key: "csharp_client",
    name: "C# Platform SDK",
    description: ".NET client stubs for enterprise integrators.",
    language: "csharp",
    tags: ["sdk", "dotnet"],
  },
  {
    key: "webhook_bridge",
    name: "Webhook Bridge Extension",
    description: "SDK extension for registering outbound webhook handlers (no vendor APIs).",
    language: "typescript",
    tags: ["sdk", "webhooks"],
  },
  {
    key: "connector_scaffold",
    name: "Connector Scaffold Kit",
    description: "Scaffold helpers for building canonical-only connectors.",
    language: "typescript",
    tags: ["sdk", "connectors"],
  },
];

export function buildSdkExtensionListings(): MarketplaceListing[] {
  return SDK_PACKAGES.map((p) => ({
    id: `mp-sdk-${p.key}`,
    key: `sdk.${p.key}`,
    category: "sdk_extensions" as const,
    name: p.name,
    description: p.description,
    version: MARKETPLACE_VERSION,
    publisher: "JAG Developer Platform",
    status: "published" as const,
    tags: [...p.tags, "extension"],
    sourceSystem: "marketplace/sdk-extensions",
    pricing: "free" as const,
    certified: true,
    capabilities: ["sdk", p.language],
    meta: { language: p.language, packageKey: p.key },
  }));
}
