/**
 * AI Agents Marketplace — soft-read Copilot 2.0 capabilities / intents.
 */

import {
  COPILOT_V2_CAPABILITIES,
  COPILOT_V2_INTENTS,
} from "@/lib/platform/executive-copilot";
import type { MarketplaceListing } from "@/lib/platform/marketplace/types";
import { MARKETPLACE_VERSION } from "@/lib/platform/marketplace/types";

const INTENT_LABELS: Record<string, string> = {
  revenue_decline: "Revenue Decline Investigator",
  disconnected_departments: "Org Silo Detector",
  initiative_impact: "Initiative Impact Analyst",
  decision_makers: "Decision Maker Mapper",
  organizational_risks: "Risk Scout",
  cross_domain: "Cross-Domain Reasoner",
  root_cause: "Root Cause Analyst",
  narrative: "Executive Narrator",
  board_prep: "Board Prep Agent",
  digital_twin: "Digital Twin Advisor",
  timeline: "Timeline Analyst",
  memory: "Institutional Memory Agent",
  general_investigate: "General Investigator",
};

export function buildAiAgentMarketplaceListings(): MarketplaceListing[] {
  const fromIntents = COPILOT_V2_INTENTS.filter((i) => i !== "general_investigate").map(
    (intent) => ({
      id: `mp-agent-${intent}`,
      key: `ai_agent.${intent}`,
      category: "ai_agents" as const,
      name: INTENT_LABELS[intent] ?? intent,
      description: `Executive Copilot 2.0 agent for intent "${intent}". Soft-read only — never mutates org state.`,
      version: MARKETPLACE_VERSION,
      publisher: "JAG Executive Copilot",
      status: "certified" as const,
      tags: ["ai", "copilot", intent, "soft_read"],
      sourceSystem: "executive-copilot",
      pricing: "included" as const,
      certified: true,
      capabilities: ["soft_read", intent],
      meta: { intent },
    })
  );

  const fromCapabilities = COPILOT_V2_CAPABILITIES.map((cap) => ({
    id: `mp-agent-cap-${cap}`,
    key: `ai_agent.capability.${cap}`,
    category: "ai_agents" as const,
    name: cap
      .split("_")
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" "),
    description: `Copilot capability pack: ${cap}`,
    version: MARKETPLACE_VERSION,
    publisher: "JAG Executive Copilot",
    status: "published" as const,
    tags: ["ai", "capability", cap],
    sourceSystem: "executive-copilot",
    pricing: "included" as const,
    certified: true,
    capabilities: [cap],
    meta: { capability: cap },
  }));

  return [...fromIntents, ...fromCapabilities];
}
