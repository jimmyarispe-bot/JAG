import type { RuntimeIdentity } from "../contracts/identity";
import type {
  RuntimeIntent,
  RuntimeIntentSignal,
  RuntimeIntentSource,
} from "../contracts/intent";
import type { RuntimeOrganizationalContext } from "../contracts/organizational-context";

export const UNKNOWN_INTENT_ID = "unknown";

export const INTENT_CONFIDENCE = {
  HIGH: 0.85,
  MEDIUM: 0.55,
} as const;

/** Opaque signal contributed by hosts / providers — not NLP. */
export interface IntentSignal extends RuntimeIntentSignal {
  kind: string;
  weight?: number;
  detail?: Readonly<Record<string, unknown>>;
  /** Optional catalog intent this signal points at. */
  intentId?: string;
  sourceClass?: IntentSignalClass;
  /** ISO expiry for time-bounded signals. */
  expiresAt?: string;
}

export type IntentSignalClass =
  | "explicit"
  | "command"
  | "navigation"
  | "context"
  | "identity"
  | "event"
  | "notification"
  | "preference"
  | "safety"
  | "provider"
  | "ai_adapter"
  | "other";

export interface IntentCandidate {
  intentId: string;
  label?: string;
  domainHints?: readonly string[];
  actionCandidates?: readonly string[];
  confidence: number;
  source: RuntimeIntentSource;
  signals: readonly IntentSignal[];
  /** Higher wins when confidence ties (conflict policy). */
  precedence: number;
  requiredPermissions?: readonly string[];
  expiresAt?: string;
  attributes?: Readonly<Record<string, unknown>>;
}

export interface IntentResolutionRequest {
  identity: RuntimeIdentity;
  organizationalContext?: RuntimeOrganizationalContext;
  /** Host-supplied signals (commands, navigation, events, …). */
  signals?: readonly IntentSignal[];
  /** Force an explicit intent id (confidence 1.0). */
  explicitIntentId?: string;
  /** Clarification choice from a prior ambiguous resolve. */
  clarificationChoice?: string;
  /** Replace active intent when set. */
  replaceIntentId?: string;
  correlationId?: string;
  sessionId?: string;
  now?: string;
  signal?: AbortSignal;
}

export type IntentResolutionOutcome =
  | { status: "resolved"; value: RuntimeIntent; concurrent?: readonly RuntimeIntent[] }
  | { status: "unknown"; value: RuntimeIntent };

export interface IntentCatalogEntry {
  intentId: string;
  label?: string;
  domainHints?: readonly string[];
  actionCandidates?: readonly string[];
  requiredPermissions?: readonly string[];
  /** Default precedence when catalog is used without a candidate. */
  precedence?: number;
  attributes?: Readonly<Record<string, unknown>>;
}

export type { RuntimeIdentity, RuntimeIntent, RuntimeIntentSignal, RuntimeIntentSource };
