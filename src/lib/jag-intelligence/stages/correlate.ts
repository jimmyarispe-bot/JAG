import type { EiEventSignal } from "@/lib/founder-intelligence/events";
import { analyzeCrossDomain } from "@/lib/founder-intelligence/correlations";

/** Stage 4 — Cross-Domain Correlation */
export function stageCrossDomainCorrelation(signals: EiEventSignal[], now = new Date()) {
  return analyzeCrossDomain(signals, now).map((c) => ({
    id: c.id,
    title: c.title,
    summary: c.summary,
    domains: c.domains as string[],
    confidence: c.confidence,
    evidence: c.explainability.evidence,
  }));
}
