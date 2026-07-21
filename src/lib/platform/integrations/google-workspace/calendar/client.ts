/**
 * Calendar retrieval client — events, meet sessions (metadata).
 * Uses the Workspace SoR client with rate limiting + pagination.
 */

import { RateLimiter, withRetry } from "@/lib/platform/integrations/common/sync/resilience";
import type { GoogleWorkspaceClient } from "@/lib/platform/integrations/connectors/google-workspace/services/demo-client";
import { createDemoGoogleWorkspaceClient } from "@/lib/platform/integrations/connectors/google-workspace/services/demo-client";
import {
  CALENDAR_OBJECT_TYPES,
  type CalendarObjectType,
  isCalendarObjectType,
} from "@/lib/platform/integrations/google-workspace/calendar/object-types";
import type {
  CalendarFetchOptions,
  CalendarListPage,
} from "@/lib/platform/integrations/google-workspace/calendar/types";
import { CALENDAR_OAUTH_SCOPES } from "@/lib/platform/integrations/google-workspace/calendar/scopes";

export type CalendarClientOptions = {
  workspaceClient?: GoogleWorkspaceClient;
  maxRequestsPerMinute?: number;
};

export class CalendarClient {
  private readonly workspace: GoogleWorkspaceClient;
  private readonly limiter: RateLimiter;

  constructor(options: CalendarClientOptions = {}) {
    this.workspace = options.workspaceClient ?? createDemoGoogleWorkspaceClient();
    this.limiter = new RateLimiter(options.maxRequestsPerMinute ?? 60, 60_000);
  }

  scopes(): readonly string[] {
    return CALENDAR_OAUTH_SCOPES;
  }

  objectTypes(): readonly CalendarObjectType[] {
    return CALENDAR_OBJECT_TYPES;
  }

  async authenticate(accessToken: string): Promise<{ ok: boolean; error?: string }> {
    const result = await this.workspace.authenticate({
      accessToken,
      consentType: "admin",
    });
    return { ok: result.ok, error: result.error };
  }

  async health(): Promise<{
    ok: boolean;
    latencyMs: number;
    rateLimitRemaining: number;
  }> {
    return this.workspace.health();
  }

  async listPage(options: CalendarFetchOptions): Promise<CalendarListPage> {
    if (!isCalendarObjectType(options.objectType)) {
      return { records: [], nextCursor: null };
    }
    await this.limiter.acquire();
    return withRetry(
      () =>
        this.workspace.list(
          options.organizationId,
          options.objectType,
          options.since ?? null,
          options.cursor ?? null
        ),
      {
        attempts: 3,
        baseDelayMs: 200,
        shouldRetry: (error) => {
          const msg = error instanceof Error ? error.message : String(error);
          return /rate.?limit|timeout|ECONN|503|429/i.test(msg);
        },
      }
    );
  }

  async listAll(
    options: Omit<CalendarFetchOptions, "cursor">
  ): Promise<{ records: CalendarListPage["records"]; newestUpdatedAt: string | null }> {
    const records: CalendarListPage["records"] = [];
    let cursor: string | null = null;
    let newestUpdatedAt: string | null = options.since ?? null;

    do {
      const page = await this.listPage({ ...options, cursor });
      for (const row of page.records) {
        records.push(row);
        if (!newestUpdatedAt || row.updatedAt > newestUpdatedAt) {
          newestUpdatedAt = row.updatedAt;
        }
      }
      cursor = page.nextCursor;
    } while (cursor);

    return { records, newestUpdatedAt };
  }
}

export function createCalendarClient(options?: CalendarClientOptions): CalendarClient {
  return new CalendarClient(options);
}
