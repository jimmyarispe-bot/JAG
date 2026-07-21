import type {
  MicrosoftSyncRegistry,
  MicrosoftSyncRun,
} from "@/lib/platform/integrations/microsoft-365/sync/types";

class MemoryMicrosoftSyncRegistry {
  readonly runs = new Map<string, MicrosoftSyncRun[]>();
  readonly cursors = new Map<string, string>();
  readonly schedules = new Map<string, MicrosoftSyncRegistry>();
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

export const memoryMicrosoftSyncRegistry = new MemoryMicrosoftSyncRegistry();
