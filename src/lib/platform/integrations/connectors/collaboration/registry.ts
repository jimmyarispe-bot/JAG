import type { IntegrationPlatformCore } from "@/lib/platform/integrations/services/create-integration-platform-core";
import { createSlackPlatformConnector } from "@/lib/platform/integrations/connectors/collaboration/slack";
import { createTeamsPlatformConnector } from "@/lib/platform/integrations/connectors/collaboration/teams";
import { createZoomPlatformConnector } from "@/lib/platform/integrations/connectors/collaboration/zoom";
import { createGoogleMeetPlatformConnector } from "@/lib/platform/integrations/connectors/collaboration/google-meet";

export function registerCollaborationPlatformConnectors(
  platform: IntegrationPlatformCore
): void {
  const connectors = [
    createSlackPlatformConnector({ publisher: platform.publisher }),
    createTeamsPlatformConnector({ publisher: platform.publisher }),
    createZoomPlatformConnector({ publisher: platform.publisher }),
    createGoogleMeetPlatformConnector({ publisher: platform.publisher }),
  ];
  for (const connector of connectors) {
    if (platform.registry.has(connector.id)) {
      platform.registry.register(connector, { replace: true });
    } else {
      platform.registerConnector(connector);
    }
  }
}
