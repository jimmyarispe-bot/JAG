/**
 * Slack — channels, threads, messages, users, reactions.
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

export const slackMetadata: ConnectorMetadata = {
  id: "slack",
  name: "Slack",
  description:
    "Collaboration connector — Slack channels, threads, messages, users, and reactions (metadata-only).",
  vendor: "Slack",
  category: "productivity",
  authMethods: ["oauth2"],
  supportsWebhook: true,
  supportsIncremental: true,
  supportsFullSync: true,
  supportsPolling: true,
  objectTypes: [...objectTypesForProvider("slack")],
  version: "1.0.0",
  placeholder: false,
};

export function createSlackPlatformConnector(options: {
  client?: CollaborationClient;
  publisher?: EventPublisher;
} = {}) {
  return createCollaborationPlatformConnector(
    {
      provider: "slack",
      displayName: "Slack",
      description: slackMetadata.description,
      capabilities: ["channels", "threads", "messages", "users", "reactions"],
    },
    options
  );
}

export function createDemoSlackClient() {
  return createDemoCollaborationClient("slack");
}

export { reconnectCollaborationConnector as reconnectSlack };
