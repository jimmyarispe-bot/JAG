/**
 * Sync orchestration primitives — cursors, job ids, modes.
 */

import type { SyncCursor, SyncMode, SyncRequest } from "@/lib/platform/integrations/common/types";

export class CursorStore {
  private readonly cursors = new Map<string, SyncCursor>();

  private key(instanceId: string, objectType: string): string {
    return `${instanceId}::${objectType}`;
  }

  get(instanceId: string, objectType: string): SyncCursor | null {
    return this.cursors.get(this.key(instanceId, objectType)) ?? null;
  }

  set(instanceId: string, objectType: string, cursor: string | null): SyncCursor {
    const record: SyncCursor = {
      instanceId,
      objectType,
      cursor,
      updatedAt: new Date().toISOString(),
    };
    this.cursors.set(this.key(instanceId, objectType), record);
    return record;
  }

  clear(instanceId: string): void {
    for (const key of [...this.cursors.keys()]) {
      if (key.startsWith(`${instanceId}::`)) this.cursors.delete(key);
    }
  }
}

export function createSyncJobId(prefix = "sync"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function resolveSyncMode(request: SyncRequest, supportsIncremental: boolean): SyncMode {
  if (request.mode === "incremental" && !supportsIncremental) return "full";
  return request.mode;
}
