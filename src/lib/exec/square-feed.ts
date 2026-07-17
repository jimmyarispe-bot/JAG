import { getSquareFeed } from "@/lib/platform/integrations/connectors/square";
import type { SquareIntelligenceFeed } from "@/lib/platform/integrations/connectors/square";
import { connectorDataMode, type ExecDataMode } from "@/lib/exec/data-mode";

export function resolveSquareFeed(organizationId: string): SquareIntelligenceFeed | null {
  return getSquareFeed(organizationId);
}

export function squareDataMode(
  feed: SquareIntelligenceFeed | null,
  freshlySynced: boolean
): ExecDataMode {
  return connectorDataMode({ hasFeed: Boolean(feed), freshlySynced, fallback: "model-baseline" });
}
