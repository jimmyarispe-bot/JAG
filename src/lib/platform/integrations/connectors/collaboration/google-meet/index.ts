/**
 * RC-3.02 — Google Meet metadata connector.
 * Ingests Meet session metadata only (no recordings/transcripts by default).
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

export const googleMeetMetadata: ConnectorMetadata = {
  id: "google_meet",
  name: "Google Meet",
  description:
    "Collaboration connector — Google Meet session metadata (participants, duration, calendar link).",
  vendor: "Google",
  category: "productivity",
  authMethods: ["oauth2"],
  supportsWebhook: true,
  supportsIncremental: true,
  supportsFullSync: true,
  supportsPolling: true,
  objectTypes: [...objectTypesForProvider("google_meet")],
  version: "1.1.0",
  placeholder: false,
};

export function createGoogleMeetPlatformConnector(options: {
  client?: CollaborationClient;
  publisher?: EventPublisher;
} = {}) {
  return createCollaborationPlatformConnector(
    {
      provider: "google_meet",
      displayName: "Google Meet",
      description: googleMeetMetadata.description,
      version: "1.1.0",
      capabilities: ["meet", "attendance", "users", "metadata-only"],
    },
    options
  );
}

export function createDemoGoogleMeetClient() {
  return createDemoCollaborationClient("google_meet");
}

export { reconnectCollaborationConnector as reconnectGoogleMeet };
