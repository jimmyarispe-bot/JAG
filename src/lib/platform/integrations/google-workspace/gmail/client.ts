/**
 * Gmail retrieval client — messages, threads, labels, attachments (metadata).
 * Uses the Workspace SoR client with rate limiting + pagination.
 */

import { RateLimiter, withRetry } from "@/lib/platform/integrations/common/sync/resilience";
import type { GoogleWorkspaceClient } from "@/lib/platform/integrations/connectors/google-workspace/services/demo-client";
import { createDemoGoogleWorkspaceClient } from "@/lib/platform/integrations/connectors/google-workspace/services/demo-client";
import {
  GMAIL_OBJECT_TYPES,
  type GmailObjectType,
  isGmailObjectType,
} from "@/lib/platform/integrations/google-workspace/gmail/object-types";
import type {
  GmailFetchOptions,
  GmailListPage,
} from "@/lib/platform/integrations/google-workspace/gmail/types";
import { GMAIL_OAUTH_SCOPES } from "@/lib/platform/integrations/google-workspace/gmail/scopes";

export type GmailClientOptions = {
  workspaceClient?: GoogleWorkspaceClient;
  /** Max Gmail list requests per minute (default 60). */
  maxRequestsPerMinute?: number;
};

export class GmailClient {
  private readonly workspace: GoogleWorkspaceClient;
  private readonly limiter: RateLimiter;

  constructor(options: GmailClientOptions = {}) {
    this.workspace = options.workspaceClient ?? createDemoGoogleWorkspaceClient();
    this.limiter = new RateLimiter(options.maxRequestsPerMinute ?? 60, 60_000);
  }

  scopes(): readonly string[] {
    return GMAIL_OAUTH_SCOPES;
  }

  objectTypes(): readonly GmailObjectType[] {
    return GMAIL_OBJECT_TYPES;
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

  async listPage(options: GmailFetchOptions): Promise<GmailListPage> {
    if (!isGmailObjectType(options.objectType)) {
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

  /**
   * Paginate an object type until exhausted. Returns all fetched rows + newest watermark.
   */
  async listAll(
    options: Omit<GmailFetchOptions, "cursor">
  ): Promise<{ records: GmailListPage["records"]; newestUpdatedAt: string | null }> {
    const records: GmailListPage["records"] = [];
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

export function createGmailClient(options?: GmailClientOptions): GmailClient {
  return new GmailClient(options);
}
