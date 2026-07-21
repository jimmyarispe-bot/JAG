/**
 * Microsoft Teams (collaboration) — teams, channels, chats, meetings.
 * Distinct from Microsoft 365 productivity connector; real-time collaboration focus.
 */

import {
  createCollaborationPlatformConnector,
  reconnectCollaborationConnector,
} from "@/lib/platform/integrations/connectors/collaboration/services/platform-connector";
import type { EventPublisher } from "@/lib/platform/integrations/events/publisher";
import type { CollaborationClient } from "@/lib/platform/integrations/connectors/collaboration/services/client";
import { createDemoCollaborationClient } from "@/lib/platform/integrations/connectors/collaboration/services/client";
import type { ConnectorMetadata } from "@/lib/platform/integrations/common/types";
import { objectTypesForProvider } from "@/lib/platform/integrations/connectors/collaboration/services/demo-catalog";

export const teamsMetadata: ConnectorMetadata = {
  id: "teams",
  name: "Microsoft Teams",
  description:
    "Collaboration connector — Teams, channels, chats, and meetings (real-time communication).",
  vendor: "Microsoft",
  category: "productivity",
  authMethods: ["oauth2"],
  supportsWebhook: true,
  supportsIncremental: true,
  supportsFullSync: true,
  supportsPolling: true,
  objectTypes: [...objectTypesForProvider("teams")],
  version: "1.0.0",
  placeholder: false,
};

export function createTeamsPlatformConnector(options: {
  client?: CollaborationClient;
  publisher?: EventPublisher;
} = {}) {
  return createCollaborationPlatformConnector(
    {
      provider: "teams",
      displayName: "Microsoft Teams",
      description: teamsMetadata.description,
      capabilities: ["teams", "channels", "chats", "meetings"],
    },
    options
  );
}

export function createDemoTeamsClient() {
  return createDemoCollaborationClient("teams");
}

export { reconnectCollaborationConnector as reconnectTeams };
