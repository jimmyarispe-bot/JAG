import {
  getPlaidFeed,
  type PlaidIntelligenceFeed,
} from "@/lib/platform/integrations/connectors/plaid";
import { connectorDataMode, type ExecDataMode } from "@/lib/exec/data-mode";

export function resolvePlaidFeed(organizationId: string): PlaidIntelligenceFeed | null {
  return getPlaidFeed(organizationId);
}

export function plaidDataMode(
  feed: PlaidIntelligenceFeed | null,
  freshlySynced: boolean
): ExecDataMode {
  return connectorDataMode({ hasFeed: Boolean(feed), freshlySynced, fallback: "model-baseline" });
}
