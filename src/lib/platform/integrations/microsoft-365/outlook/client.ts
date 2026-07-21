import { RateLimiter, withRetry } from "@/lib/platform/integrations/common/sync/resilience";
import type { Microsoft365ObjectType } from "@/lib/platform/integrations/connectors/microsoft-365/entities";
import type {
  Microsoft365Client,
  Microsoft365ListPage,
} from "@/lib/platform/integrations/connectors/microsoft-365/services/demo-client";
import { createDemoMicrosoft365Client } from "@/lib/platform/integrations/connectors/microsoft-365/services/demo-client";
import {
  isOutlookObjectType,
  OUTLOOK_OBJECT_TYPES,
  type OutlookObjectType,
} from "@/lib/platform/integrations/microsoft-365/outlook/object-types";

export type OutlookFetchOptions = {
  organizationId: string;
  objectType: OutlookObjectType | Microsoft365ObjectType | string;
  since?: string | null;
  cursor?: string | null;
};

export type OutlookClientOptions = {
  microsoftClient?: Microsoft365Client;
  maxRequestsPerMinute?: number;
};

export class OutlookClient {
  private readonly client: Microsoft365Client;
  private readonly limiter: RateLimiter;

  constructor(options: OutlookClientOptions = {}) {
    this.client = options.microsoftClient ?? createDemoMicrosoft365Client();
    this.limiter = new RateLimiter(options.maxRequestsPerMinute ?? 60, 60_000);
  }

  objectTypes(): readonly OutlookObjectType[] {
    return OUTLOOK_OBJECT_TYPES;
  }

  async health() {
    return this.client.health();
  }

  async listPage(options: OutlookFetchOptions): Promise<Microsoft365ListPage> {
    if (!isOutlookObjectType(options.objectType)) {
      return { records: [], nextCursor: null };
    }
    await this.limiter.acquire();
    const objectType = options.objectType as OutlookObjectType;
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

export function createOutlookClient(options?: OutlookClientOptions): OutlookClient {
  return new OutlookClient(options);
}
