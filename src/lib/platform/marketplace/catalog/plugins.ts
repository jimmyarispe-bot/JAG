/**
 * Third-party Plugins Marketplace — partner listings (certified / reviewable).
 * Soft-read catalog only — install records intent, never loads remote code.
 */

import type { MarketplaceListing } from "@/lib/platform/marketplace/types";
import { MARKETPLACE_VERSION } from "@/lib/platform/marketplace/types";

const PLUGINS: Array<{
  key: string;
  name: string;
  description: string;
  publisher: string;
  certified: boolean;
  tags: string[];
  capabilities: string[];
}> = [
  {
    key: "partner_docu_sign_bridge",
    name: "DocuSign Intent Bridge",
    description:
      "Partner plugin that records e-sign intents via platform actions (no vendor SDK in soft-read path).",
    publisher: "Partner · Contoso Legal",
    certified: true,
    tags: ["legal", "esign", "partner"],
    capabilities: ["approval_hook", "notification"],
  },
  {
    key: "partner_sms_gateway",
    name: "SMS Gateway Plugin",
    description: "Queues SMS notifications through platform notification channels.",
    publisher: "Partner · RelayComms",
    certified: true,
    tags: ["sms", "notifications", "partner"],
    capabilities: ["notification"],
  },
  {
    key: "partner_bi_export",
    name: "BI Export Plugin",
    description: "Exports soft-read report snapshots to partner BI warehouses.",
    publisher: "Partner · Northstar Analytics",
    certified: false,
    tags: ["bi", "export", "partner"],
    capabilities: ["report_export"],
  },
  {
    key: "partner_background_check",
    name: "Background Check Intent Plugin",
    description: "HR onboarding hook that records background-check intents for human approval.",
    publisher: "Partner · ClearHire",
    certified: true,
    tags: ["hr", "compliance", "partner"],
    capabilities: ["approval_hook", "hr"],
  },
  {
    key: "community_slack_digest",
    name: "Community Slack Digest",
    description: "Community plugin that formats collaboration health digests (soft-read).",
    publisher: "Community",
    certified: false,
    tags: ["collaboration", "community"],
    capabilities: ["digest"],
  },
];

export function buildPluginMarketplaceListings(): MarketplaceListing[] {
  return PLUGINS.map((p) => ({
    id: `mp-plugin-${p.key}`,
    key: `plugin.${p.key}`,
    category: "plugins" as const,
    name: p.name,
    description: p.description,
    version: MARKETPLACE_VERSION,
    publisher: p.publisher,
    status: p.certified ? ("certified" as const) : ("published" as const),
    tags: ["plugin", "third_party", ...p.tags],
    sourceSystem: "marketplace/plugins",
    pricing: "partner" as const,
    certified: p.certified,
    capabilities: p.capabilities,
    meta: { pluginKey: p.key, loadsRemoteCode: false },
  }));
}
