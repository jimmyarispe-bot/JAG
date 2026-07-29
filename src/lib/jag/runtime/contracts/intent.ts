export type RuntimeIntentSource = "explicit" | "inferred" | "hybrid" | "unknown";

export interface RuntimeIntent {
  intentId: string;
  label?: string;
  domainHints: readonly string[];
  actionCandidates: readonly string[];
  confidence: number;
  source: RuntimeIntentSource;
  signals: readonly RuntimeIntentSignal[];
  conflicts: readonly string[];
  requiresClarification: boolean;
  historyRef?: string;
  resolvedAt: string;
  attributes?: Readonly<Record<string, unknown>>;
}

export interface RuntimeIntentSignal {
  kind: string;
  weight?: number;
  detail?: Readonly<Record<string, unknown>>;
}
