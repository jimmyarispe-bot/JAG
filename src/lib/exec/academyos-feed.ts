import { getAcademyOsFeed } from "@/lib/platform/integrations/connectors/academyos";
import type { AcademyOsIntelligenceFeed } from "@/lib/platform/integrations/connectors/academyos";
import type { ExecDataMode } from "@/lib/exec/data-mode";

export function resolveAcademyOsFeed(organizationId: string): AcademyOsIntelligenceFeed | null {
  return getAcademyOsFeed(organizationId);
}

export function liveMode(feed: AcademyOsIntelligenceFeed | null): ExecDataMode {
  return feed?.live ? "live" : "model-baseline";
}
