import type {
  ContextSnapshot,
  ContextSnapshotRecord,
} from "./context-types";

/**
 * In-memory persistent / temporary context + named snapshots.
 * Keyed by identity principal (host may replace with durable store).
 */
export class ContextStore {
  private readonly persistent = new Map<string, ContextSnapshot>();
  private readonly temporary = new Map<string, ContextSnapshot>();
  private readonly snapshots = new Map<string, ContextSnapshotRecord>();
  private seq = 0;

  private key(principalId: string, organizationId?: string): string {
    return `${principalId}::${organizationId ?? "*"}`;
  }

  getPersistent(
    principalId: string,
    organizationId?: string
  ): ContextSnapshot | null {
    if (organizationId) {
      return this.persistent.get(this.key(principalId, organizationId)) ?? null;
    }
    for (const [k, v] of this.persistent) {
      if (k.startsWith(`${principalId}::`)) return v;
    }
    return null;
  }

  setPersistent(principalId: string, snapshot: ContextSnapshot): void {
    this.persistent.set(
      this.key(principalId, snapshot.organizationId),
      snapshot
    );
  }

  getTemporary(
    principalId: string,
    organizationId?: string
  ): ContextSnapshot | null {
    if (organizationId) {
      return this.temporary.get(this.key(principalId, organizationId)) ?? null;
    }
    for (const [k, v] of this.temporary) {
      if (k.startsWith(`${principalId}::`)) return v;
    }
    return null;
  }

  setTemporary(principalId: string, snapshot: ContextSnapshot): void {
    this.temporary.set(
      this.key(principalId, snapshot.organizationId),
      snapshot
    );
  }

  clearTemporary(principalId: string, organizationId?: string): boolean {
    if (organizationId) {
      return this.temporary.delete(this.key(principalId, organizationId));
    }
    let removed = false;
    for (const k of [...this.temporary.keys()]) {
      if (k.startsWith(`${principalId}::`)) {
        this.temporary.delete(k);
        removed = true;
      }
    }
    return removed;
  }

  createSnapshot(
    principalId: string,
    active: ContextSnapshot
  ): ContextSnapshotRecord {
    const snapshotId = `csnap_${++this.seq}_${Date.now().toString(36)}`;
    const record: ContextSnapshotRecord = {
      snapshotId,
      snapshot: active,
      persistent: this.getPersistent(principalId, active.organizationId),
      temporary: this.getTemporary(principalId, active.organizationId),
      createdAt: new Date().toISOString(),
    };
    this.snapshots.set(snapshotId, record);
    return record;
  }

  getSnapshot(snapshotId: string): ContextSnapshotRecord | null {
    return this.snapshots.get(snapshotId) ?? null;
  }

  restoreSnapshot(
    principalId: string,
    snapshotId: string
  ): ContextSnapshotRecord | null {
    const record = this.snapshots.get(snapshotId);
    if (!record) return null;
    if (record.persistent) {
      this.setPersistent(principalId, record.persistent);
    }
    if (record.temporary) {
      this.setTemporary(principalId, record.temporary);
    } else {
      this.clearTemporary(
        principalId,
        record.snapshot.organizationId
      );
    }
    return record;
  }

  clear(): void {
    this.persistent.clear();
    this.temporary.clear();
    this.snapshots.clear();
  }
}

export function createContextStore(): ContextStore {
  return new ContextStore();
}
