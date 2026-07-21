/**
 * Zoom — meetings, recordings metadata, attendance, duration.
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

export const zoomMetadata: ConnectorMetadata = {
  id: "zoom",
  name: "Zoom",
  description:
    "Collaboration connector — Zoom meetings, recording metadata, attendance, and duration.",
  vendor: "Zoom",
  category: "productivity",
  authMethods: ["oauth2"],
  supportsWebhook: true,
  supportsIncremental: true,
  supportsFullSync: true,
  supportsPolling: true,
  objectTypes: [...objectTypesForProvider("zoom")],
  version: "1.0.0",
  placeholder: false,
};

export function createZoomPlatformConnector(options: {
  client?: CollaborationClient;
  publisher?: EventPublisher;
} = {}) {
  return createCollaborationPlatformConnector(
    {
      provider: "zoom",
      displayName: "Zoom",
      description: zoomMetadata.description,
      capabilities: ["meetings", "recordings", "attendance", "duration"],
    },
    options
  );
}

export function createDemoZoomClient() {
  return createDemoCollaborationClient("zoom");
}

export { reconnectCollaborationConnector as reconnectZoom };
