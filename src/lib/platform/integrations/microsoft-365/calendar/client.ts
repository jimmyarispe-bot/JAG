import { RateLimiter, withRetry } from "@/lib/platform/integrations/common/sync/resilience";
import type {
  Microsoft365Client,
  Microsoft365ListPage,
} from "@/lib/platform/integrations/connectors/microsoft-365/services/demo-client";
import { createDemoMicrosoft365Client } from "@/lib/platform/integrations/connectors/microsoft-365/services/demo-client";
import {
  CALENDAR_OBJECT_TYPES,
  isCalendarObjectType,
  type CalendarObjectType,
} from "@/lib/platform/integrations/microsoft-365/calendar/object-types";

export type CalendarFetchOptions = {
  organizationId: string;
  objectType: CalendarObjectType | string;
  since?: string | null;
  cursor?: string | null;
};

export type CalendarClientOptions = {
  microsoftClient?: Microsoft365Client;
  maxRequestsPerMinute?: number;
};

export class CalendarClient {
  private readonly client: Microsoft365Client;
  private readonly limiter: RateLimiter;

  constructor(options: CalendarClientOptions = {}) {
    this.client = options.microsoftClient ?? createDemoMicrosoft365Client();
    this.limiter = new RateLimiter(options.maxRequestsPerMinute ?? 60, 60_000);
  }

  objectTypes(): readonly CalendarObjectType[] {
    return CALENDAR_OBJECT_TYPES;
  }

  async listPage(options: CalendarFetchOptions): Promise<Microsoft365ListPage> {
    if (!isCalendarObjectType(options.objectType)) {
      return { records: [], nextCursor: null };
    }
    await this.limiter.acquire();
    const objectType = options.objectType as CalendarObjectType;
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

export function createCalendarClient(options?: CalendarClientOptions): CalendarClient {
  return new CalendarClient(options);
}
