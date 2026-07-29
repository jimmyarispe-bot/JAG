import type { RuntimeIntent } from "../contracts/intent";

export interface IntentHistoryEntry {
  intent: RuntimeIntent;
  recordedAt: string;
  expiresAt?: string;
}

/**
 * Per-principal ring buffer of resolved intents.
 * Not Organizational Memory — short continuity only.
 */
export class IntentHistory {
  private readonly buffers = new Map<string, IntentHistoryEntry[]>();
  private readonly maxSize: number;

  constructor(options: { maxSize?: number } = {}) {
    this.maxSize = options.maxSize ?? 20;
  }

  append(
    principalId: string,
    intent: RuntimeIntent,
    expiresAt?: string
  ): void {
    const list = this.buffers.get(principalId) ?? [];
    list.push({
      intent,
      recordedAt: intent.resolvedAt,
      expiresAt,
    });
    while (list.length > this.maxSize) {
      list.shift();
    }
    this.buffers.set(principalId, list);
  }

  list(
    principalId: string,
    limit?: number,
    nowIso?: string
  ): RuntimeIntent[] {
    const now = nowIso ? Date.parse(nowIso) : Date.now();
    const list = (this.buffers.get(principalId) ?? []).filter((e) => {
      if (!e.expiresAt) return true;
      return Date.parse(e.expiresAt) > now;
    });
    const intents = list.map((e) => e.intent);
    if (limit === undefined) return [...intents].reverse();
    return [...intents].reverse().slice(0, limit);
  }

  /** Drop expired entries; emit ids of removed intents. */
  purgeExpired(principalId: string, nowIso: string): string[] {
    const now = Date.parse(nowIso);
    const list = this.buffers.get(principalId) ?? [];
    const kept: IntentHistoryEntry[] = [];
    const expired: string[] = [];
    for (const entry of list) {
      if (entry.expiresAt && Date.parse(entry.expiresAt) <= now) {
        expired.push(entry.intent.intentId);
      } else {
        kept.push(entry);
      }
    }
    this.buffers.set(principalId, kept);
    return expired;
  }

  clear(principalId?: string): void {
    if (principalId) {
      this.buffers.delete(principalId);
      return;
    }
    this.buffers.clear();
  }
}

export function createIntentHistory(options?: {
  maxSize?: number;
}): IntentHistory {
  return new IntentHistory(options);
}
