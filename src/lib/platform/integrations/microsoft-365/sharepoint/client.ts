import { RateLimiter, withRetry } from "@/lib/platform/integrations/common/sync/resilience";
import type {
  Microsoft365Client,
  Microsoft365ListPage,
} from "@/lib/platform/integrations/connectors/microsoft-365/services/demo-client";
import { createDemoMicrosoft365Client } from "@/lib/platform/integrations/connectors/microsoft-365/services/demo-client";
import {
  isSharePointObjectType,
  SHAREPOINT_OBJECT_TYPES,
  type SharePointObjectType,
} from "@/lib/platform/integrations/microsoft-365/sharepoint/object-types";

export type SharePointFetchOptions = {
  organizationId: string;
  objectType: SharePointObjectType | string;
  since?: string | null;
  cursor?: string | null;
};

export type SharePointClientOptions = {
  microsoftClient?: Microsoft365Client;
  maxRequestsPerMinute?: number;
};

export class SharePointClient {
  private readonly client: Microsoft365Client;
  private readonly limiter: RateLimiter;

  constructor(options: SharePointClientOptions = {}) {
    this.client = options.microsoftClient ?? createDemoMicrosoft365Client();
    this.limiter = new RateLimiter(options.maxRequestsPerMinute ?? 60, 60_000);
  }

  objectTypes(): readonly SharePointObjectType[] {
    return SHAREPOINT_OBJECT_TYPES;
  }

  async listPage(options: SharePointFetchOptions): Promise<Microsoft365ListPage> {
    if (!isSharePointObjectType(options.objectType)) {
      return { records: [], nextCursor: null };
    }
    await this.limiter.acquire();
    const objectType = options.objectType as SharePointObjectType;
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

export function createSharePointClient(options?: SharePointClientOptions): SharePointClient {
  return new SharePointClient(options);
}
