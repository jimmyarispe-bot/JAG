/**
 * In-process sync registry — used for tests and as fallback when DB tables
 * are not yet migrated.
 */

import type {
  GoogleSyncRegistry,
  GoogleSyncRun,
} from "@/lib/platform/integrations/google-workspace/sync/types";

class MemoryGoogleSyncRegistry {
  readonly runs = new Map<string, GoogleSyncRun[]>();
  readonly cursors = new Map<string, string>();
  readonly schedules = new Map<string, GoogleSyncRegistry>();
  readonly connectionPointers = new Map<
    string,
    {
      lastSyncAt: string | null;
      lastSyncStatus: string | null;
      lastSyncError: string | null;
      lastSyncDurationMs: number | null;
      lastSyncRecords: number | null;
      recordsImported: number;
    }
  >();

  cursorKey(connectionId: string, objectType: string): string {
    return `${connectionId}::${objectType}`;
  }

  clear(): void {
    this.runs.clear();
    this.cursors.clear();
    this.schedules.clear();
    this.connectionPointers.clear();
  }
}

export const memoryGoogleSyncRegistry = new MemoryGoogleSyncRegistry();
