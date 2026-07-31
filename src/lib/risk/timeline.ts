import { randomUUID } from "node:crypto";
import { appendRiskTimeline, listRiskTimeline } from "@/lib/risk/store";
import type { RiskTimelineEntry, RiskTimelineKind } from "@/lib/risk/types";

export type RiskTimelineService = {
  record(input: {
    organizationId: string;
    riskId: string;
    kind: RiskTimelineKind;
    actor: string;
    message: string;
    metadata?: Record<string, string>;
  }): RiskTimelineEntry;
  list(organizationId: string, riskId?: string): readonly RiskTimelineEntry[];
};

export function createRiskTimeline(): RiskTimelineService {
  return {
    record(input) {
      return appendRiskTimeline({
        id: randomUUID(),
        organizationId: input.organizationId,
        riskId: input.riskId,
        kind: input.kind,
        at: new Date().toISOString(),
        actor: input.actor,
        message: input.message,
        metadata: Object.freeze(input.metadata ?? {}),
      });
    },
    list: listRiskTimeline,
  };
}
