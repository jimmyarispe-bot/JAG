/**
 * Drive retrieval client — files and folders (metadata).
 * Uses the Workspace SoR client with rate limiting + pagination.
 */

import { RateLimiter, withRetry } from "@/lib/platform/integrations/common/sync/resilience";
import type { GoogleWorkspaceClient } from "@/lib/platform/integrations/connectors/google-workspace/services/demo-client";
import { createDemoGoogleWorkspaceClient } from "@/lib/platform/integrations/connectors/google-workspace/services/demo-client";
import {
  DRIVE_OBJECT_TYPES,
  type DriveObjectType,
  isDriveObjectType,
} from "@/lib/platform/integrations/google-workspace/drive/object-types";
import type {
  DriveFetchOptions,
  DriveListPage,
} from "@/lib/platform/integrations/google-workspace/drive/types";
import { DRIVE_OAUTH_SCOPES } from "@/lib/platform/integrations/google-workspace/drive/scopes";

export type DriveClientOptions = {
  workspaceClient?: GoogleWorkspaceClient;
  maxRequestsPerMinute?: number;
};

export class DriveClient {
  private readonly workspace: GoogleWorkspaceClient;
  private readonly limiter: RateLimiter;

  constructor(options: DriveClientOptions = {}) {
    this.workspace = options.workspaceClient ?? createDemoGoogleWorkspaceClient();
    this.limiter = new RateLimiter(options.maxRequestsPerMinute ?? 60, 60_000);
  }

  scopes(): readonly string[] {
    return DRIVE_OAUTH_SCOPES;
  }

  objectTypes(): readonly DriveObjectType[] {
    return DRIVE_OBJECT_TYPES;
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

  async listPage(options: DriveFetchOptions): Promise<DriveListPage> {
    if (!isDriveObjectType(options.objectType)) {
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
    options: Omit<DriveFetchOptions, "cursor">
  ): Promise<{ records: DriveListPage["records"]; newestUpdatedAt: string | null }> {
    const records: DriveListPage["records"] = [];
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

export function createDriveClient(options?: DriveClientOptions): DriveClient {
  return new DriveClient(options);
}
