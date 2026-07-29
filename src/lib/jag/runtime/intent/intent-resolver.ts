import type { RuntimeIdentity } from "../contracts/identity";
import type { RuntimeIntent } from "../contracts/intent";
import type { IntentRegistry } from "./intent-registry";
import {
  INTENT_CONFIDENCE,
  UNKNOWN_INTENT_ID,
  type IntentCandidate,
  type IntentSignal,
} from "./intent-types";

/** Precedence ranks aligned with Intent Runtime spec conflict order. */
export const INTENT_PRECEDENCE = {
  EXPLICIT: 100,
  TEMPORARY_CONTEXT_TASK: 80,
  SAFETY: 70,
  PREFERENCE: 50,
  CONTEXT_FAMILY_DEFAULT: 40,
  PROVIDER: 30,
  INFERRED: 20,
  UNKNOWN: 0,
} as const;

export interface IntentResolver {
  mergeSignals(signals: readonly IntentSignal[]): IntentSignal[];
  filterCandidates(
    identity: RuntimeIdentity,
    candidates: readonly IntentCandidate[],
    nowIso: string
  ): IntentCandidate[];
  pickWinner(candidates: readonly IntentCandidate[]): {
    winner: IntentCandidate | null;
    conflicts: IntentCandidate[];
    requiresClarification: boolean;
  };
  toRuntimeIntent(
    winner: IntentCandidate | null,
    conflicts: readonly IntentCandidate[],
    requiresClarification: boolean,
    historyRef: string | undefined,
    nowIso: string,
    registry: IntentRegistry
  ): RuntimeIntent;
}

export class DefaultIntentResolver implements IntentResolver {
  mergeSignals(signals: readonly IntentSignal[]): IntentSignal[] {
    // Preserve order; drop expired at filter time. Dedupe identical kind+intentId+weight.
    const seen = new Set<string>();
    const out: IntentSignal[] = [];
    for (const s of signals) {
      const key = `${s.kind}|${s.intentId ?? ""}|${s.weight ?? ""}|${JSON.stringify(s.detail ?? {})}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(s);
    }
    return out;
  }

  filterCandidates(
    identity: RuntimeIdentity,
    candidates: readonly IntentCandidate[],
    nowIso: string
  ): IntentCandidate[] {
    const now = Date.parse(nowIso);
    return candidates.filter((c) => {
      if (c.expiresAt && Date.parse(c.expiresAt) <= now) return false;
      if (c.requiredPermissions?.length) {
        return c.requiredPermissions.every((p) =>
          identity.permissions.includes(p)
        );
      }
      return true;
    });
  }

  pickWinner(candidates: readonly IntentCandidate[]): {
    winner: IntentCandidate | null;
    conflicts: IntentCandidate[];
    requiresClarification: boolean;
  } {
    if (candidates.length === 0) {
      return { winner: null, conflicts: [], requiresClarification: false };
    }

    const sorted = [...candidates].sort((a, b) => {
      if (b.precedence !== a.precedence) return b.precedence - a.precedence;
      if (b.confidence !== a.confidence) return b.confidence - a.confidence;
      return a.intentId.localeCompare(b.intentId);
    });

    const top = sorted[0]!;
    const sameIntent = sorted.filter((c) => c.intentId === top.intentId);
    const rivals = sorted.filter((c) => c.intentId !== top.intentId);

    // Explicit different intent always beats inferred of another id (already by precedence).
    // Tie on precedence+confidence across different intentIds → clarification.
    const tiedRival = rivals.find(
      (r) =>
        r.precedence === top.precedence &&
        Math.abs(r.confidence - top.confidence) < 0.001
    );

    const requiresClarification =
      Boolean(tiedRival) ||
      (top.confidence < INTENT_CONFIDENCE.MEDIUM &&
        top.source !== "explicit");

    // Merge signals from same-intent candidates for richer evidence.
    const winner: IntentCandidate = {
      ...top,
      confidence: Math.max(...sameIntent.map((c) => c.confidence)),
      signals: sameIntent.flatMap((c) => c.signals),
      domainHints: unique(
        sameIntent.flatMap((c) => c.domainHints ?? [])
      ),
      actionCandidates: unique(
        sameIntent.flatMap((c) => c.actionCandidates ?? [])
      ),
    };

    return {
      winner,
      conflicts: rivals,
      requiresClarification,
    };
  }

  toRuntimeIntent(
    winner: IntentCandidate | null,
    conflicts: readonly IntentCandidate[],
    requiresClarification: boolean,
    historyRef: string | undefined,
    nowIso: string,
    registry: IntentRegistry
  ): RuntimeIntent {
    if (!winner) {
      return {
        intentId: UNKNOWN_INTENT_ID,
        label: "Unknown",
        domainHints: [],
        actionCandidates: [],
        confidence: 0,
        source: "unknown",
        signals: [],
        conflicts: conflicts.map((c) => c.intentId),
        requiresClarification: true,
        historyRef,
        resolvedAt: nowIso,
      };
    }

    const catalog = registry.getCatalogEntry(winner.intentId);
    const confidence = clamp01(winner.confidence);
    const clarification =
      requiresClarification ||
      (winner.source !== "explicit" && confidence < INTENT_CONFIDENCE.MEDIUM);

    return {
      intentId: winner.intentId,
      label: winner.label ?? catalog?.label,
      domainHints: unique([
        ...(winner.domainHints ?? []),
        ...(catalog?.domainHints ?? []),
      ]),
      actionCandidates: unique([
        ...(winner.actionCandidates ?? []),
        ...(catalog?.actionCandidates ?? []),
      ]),
      confidence,
      source: winner.source,
      signals: winner.signals,
      conflicts: conflicts.map((c) => c.intentId),
      requiresClarification: clarification,
      historyRef,
      resolvedAt: nowIso,
      attributes: {
        ...(catalog?.attributes ?? {}),
        ...(winner.attributes ?? {}),
        expiresAt: winner.expiresAt,
      },
    };
  }
}

export function createIntentResolver(): IntentResolver {
  return new DefaultIntentResolver();
}

export function explicitCandidate(
  intentId: string,
  signals: readonly IntentSignal[],
  extras: Partial<IntentCandidate> = {}
): IntentCandidate {
  return {
    intentId,
    confidence: 1,
    source: "explicit",
    signals,
    precedence: INTENT_PRECEDENCE.EXPLICIT,
    ...extras,
  };
}

export function unknownCandidate(
  signals: readonly IntentSignal[] = []
): IntentCandidate {
  return {
    intentId: UNKNOWN_INTENT_ID,
    confidence: 0,
    source: "unknown",
    signals,
    precedence: INTENT_PRECEDENCE.UNKNOWN,
  };
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}
