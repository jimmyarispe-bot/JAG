/**
 * ECC data provenance labels for widgets.
 */

export type ExecDataMode = "live" | "cached" | "model-baseline" | "synthetic";

export const DATA_MODE_LABEL: Record<ExecDataMode, string> = {
  live: "Live data",
  cached: "Cached data",
  "model-baseline": "Model baseline — connect data",
  synthetic: "Sample / simulated data",
};

export function isPlaceholderData(mode: ExecDataMode): boolean {
  return mode !== "live" && mode !== "cached";
}

/** Prefer live when freshly synced; cached when store has data without a fresh sync. */
export function connectorDataMode(options: {
  hasFeed: boolean;
  freshlySynced?: boolean;
  fallback?: ExecDataMode;
}): ExecDataMode {
  if (!options.hasFeed) return options.fallback ?? "model-baseline";
  return options.freshlySynced ? "live" : "cached";
}
