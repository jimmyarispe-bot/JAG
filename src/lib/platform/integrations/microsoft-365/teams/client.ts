import { RateLimiter, withRetry } from "@/lib/platform/integrations/common/sync/resilience";
import type {
  Microsoft365Client,
  Microsoft365ListPage,
} from "@/lib/platform/integrations/connectors/microsoft-365/services/demo-client";
import { createDemoMicrosoft365Client } from "@/lib/platform/integrations/connectors/microsoft-365/services/demo-client";
import {
  isTeamsObjectType,
  TEAMS_OBJECT_TYPES,
  type TeamsObjectType,
} from "@/lib/platform/integrations/microsoft-365/teams/object-types";

export type TeamsFetchOptions = {
  organizationId: string;
  objectType: TeamsObjectType | string;
  since?: string | null;
  cursor?: string | null;
};

export type TeamsClientOptions = {
  microsoftClient?: Microsoft365Client;
  maxRequestsPerMinute?: number;
};

export class TeamsClient {
  private readonly client: Microsoft365Client;
  private readonly limiter: RateLimiter;

  constructor(options: TeamsClientOptions = {}) {
    this.client = options.microsoftClient ?? createDemoMicrosoft365Client();
    this.limiter = new RateLimiter(options.maxRequestsPerMinute ?? 60, 60_000);
  }

  objectTypes(): readonly TeamsObjectType[] {
    return TEAMS_OBJECT_TYPES;
  }

  async listPage(options: TeamsFetchOptions): Promise<Microsoft365ListPage> {
    if (!isTeamsObjectType(options.objectType)) {
      return { records: [], nextCursor: null };
    }
    await this.limiter.acquire();
    const objectType = options.objectType as TeamsObjectType;
    return withRetry(
      () =>
        this.client.list(
          options.organizationId,
          objectType,
          options.since ?? null,
          options.cursor ?? null
        ),
      { attempts: 3, baseDelayMs: 150 }
    );
  }
}

export function createTeamsClient(options?: TeamsClientOptions): TeamsClient {
  return new TeamsClient(options);
}
