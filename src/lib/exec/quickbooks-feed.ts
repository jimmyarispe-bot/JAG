import {
  getQuickBooksFeed,
  type QuickBooksIntelligenceFeed,
} from "@/lib/platform/integrations/connectors/quickbooks";
import { connectorDataMode, type ExecDataMode } from "@/lib/exec/data-mode";

export function resolveQuickBooksFeed(
  organizationId: string
): QuickBooksIntelligenceFeed | null {
  return getQuickBooksFeed(organizationId);
}

export function quickBooksDataMode(
  feed: QuickBooksIntelligenceFeed | null,
  freshlySynced: boolean
): ExecDataMode {
  return connectorDataMode({ hasFeed: Boolean(feed), freshlySynced, fallback: "model-baseline" });
}
