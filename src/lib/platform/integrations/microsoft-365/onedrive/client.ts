import { RateLimiter, withRetry } from "@/lib/platform/integrations/common/sync/resilience";
import type {
  Microsoft365Client,
  Microsoft365ListPage,
} from "@/lib/platform/integrations/connectors/microsoft-365/services/demo-client";
import { createDemoMicrosoft365Client } from "@/lib/platform/integrations/connectors/microsoft-365/services/demo-client";
import {
  isOneDriveObjectType,
  ONEDRIVE_OBJECT_TYPES,
  type OneDriveObjectType,
} from "@/lib/platform/integrations/microsoft-365/onedrive/object-types";

export type OneDriveFetchOptions = {
  organizationId: string;
  objectType: OneDriveObjectType | string;
  since?: string | null;
  cursor?: string | null;
};

export type OneDriveClientOptions = {
  microsoftClient?: Microsoft365Client;
  maxRequestsPerMinute?: number;
};

export class OneDriveClient {
  private readonly client: Microsoft365Client;
  private readonly limiter: RateLimiter;

  constructor(options: OneDriveClientOptions = {}) {
    this.client = options.microsoftClient ?? createDemoMicrosoft365Client();
    this.limiter = new RateLimiter(options.maxRequestsPerMinute ?? 60, 60_000);
  }

  objectTypes(): readonly OneDriveObjectType[] {
    return ONEDRIVE_OBJECT_TYPES;
  }

  async listPage(options: OneDriveFetchOptions): Promise<Microsoft365ListPage> {
    if (!isOneDriveObjectType(options.objectType)) {
      return { records: [], nextCursor: null };
    }
    await this.limiter.acquire();
    const objectType = options.objectType as OneDriveObjectType;
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

export function createOneDriveClient(options?: OneDriveClientOptions): OneDriveClient {
  return new OneDriveClient(options);
}
