import {
  getGoogleWorkspaceFeed,
  type GoogleWorkspaceIntelligenceFeed,
} from "@/lib/platform/integrations/connectors/google-workspace";
import { connectorDataMode, type ExecDataMode } from "@/lib/exec/data-mode";

export function resolveGoogleWorkspaceFeed(
  organizationId: string
): GoogleWorkspaceIntelligenceFeed | null {
  return getGoogleWorkspaceFeed(organizationId);
}

export function googleWorkspaceDataMode(
  feed: GoogleWorkspaceIntelligenceFeed | null,
  freshlySynced: boolean
): ExecDataMode {
  return connectorDataMode({ hasFeed: Boolean(feed), freshlySynced, fallback: "model-baseline" });
}
