/**
 * ECC data provenance — until connectors land, widgets may show model baseline
 * (intelligence package defaults) or curated synthetic samples. Always label.
 */

export type ExecDataMode = "live" | "model-baseline" | "synthetic";

export const DATA_MODE_LABEL: Record<ExecDataMode, string> = {
  live: "Live data",
  "model-baseline": "Model baseline — connect data",
  synthetic: "Sample / simulated data",
};

export function isPlaceholderData(mode: ExecDataMode): boolean {
  return mode !== "live";
}
