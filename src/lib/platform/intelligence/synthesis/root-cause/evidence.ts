import type { DomainSignalLight, SynthesisEvidence } from "@/lib/platform/intelligence/synthesis/types";

export function evidenceFromSignals(
  signals: DomainSignalLight[],
  createId: (prefix: string) => string
): SynthesisEvidence[] {
  return signals.map((s, i) => ({
    id: createId(`ev-${i}`),
    domain: s.domain,
    statement: s.narrative ?? `${s.domain} signal ${s.direction ?? "unknown"} (score ${s.score ?? "n/a"})`,
    weight: s.direction === "down" ? 0.85 : 0.55,
    supporting: true,
  }));
}
