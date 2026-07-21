/**
 * Sprint 062 — Executive Briefing Intelligence engine facade.
 */

import { createBuiltinPersonalizers } from "@/lib/platform/intelligence/briefing/personalization";
import {
  createDefaultPersonalizerRegistry,
  type BriefingPersonalizerRegistry,
} from "@/lib/platform/intelligence/briefing/registry";
import { generateExecutiveBriefing } from "@/lib/platform/intelligence/briefing/engine/briefing-generator";
import type {
  BriefingPersonalizer,
  BriefingRequest,
  BriefingResult,
} from "@/lib/platform/intelligence/briefing/types";
import { BRIEFING_INTELLIGENCE_VERSION } from "@/lib/platform/intelligence/briefing/types";

export interface BriefingEngineDependencies {
  registry?: BriefingPersonalizerRegistry;
  personalizers?: BriefingPersonalizer[];
  createId?: (prefix: string) => string;
  now?: () => Date;
}

let idSeq = 0;

function defaultCreateId(prefix: string): string {
  idSeq += 1;
  return `${prefix}-${idSeq}`;
}

export class BriefingEngine {
  readonly registry: BriefingPersonalizerRegistry;
  private readonly createId: (prefix: string) => string;
  private readonly now: () => Date;

  constructor(deps: BriefingEngineDependencies = {}) {
    this.registry =
      deps.registry ??
      createDefaultPersonalizerRegistry(
        deps.personalizers ?? createBuiltinPersonalizers()
      );
    this.createId = deps.createId ?? defaultCreateId;
    this.now = deps.now ?? (() => new Date());
  }

  registerPersonalizer(personalizer: BriefingPersonalizer): void {
    this.registry.register(personalizer);
  }

  build(request: BriefingRequest): BriefingResult {
    const briefing = generateExecutiveBriefing({
      request,
      registry: this.registry,
      createId: this.createId,
      now: this.now,
    });

    const healthValue =
      request.synthesisResult?.healthScore?.value ??
      briefing.sections.organizationHealth?.value ??
      70;

    return {
      requestId: request.requestId,
      version: BRIEFING_INTELLIGENCE_VERSION,
      scope: request.scope,
      generatedAt: this.now().toISOString(),
      healthScore: {
        value: Math.round(healthValue),
        label:
          healthValue >= 70
            ? "stable"
            : healthValue >= 45
              ? "watch"
              : "elevated_risk",
      },
      briefing,
      overnight: briefing.sections.overnight,
      decisionQueue: briefing.decisionQueue,
      opportunityQueue: briefing.opportunityQueue,
      timeline: briefing.timeline,
      contributingDomains: briefing.contributingDomains,
      metadata: {
        pipeline: "briefing-engine",
        personalizerCount: this.registry.list().length,
        ...(request.metadata ?? {}),
      },
    };
  }
}

export function resetBriefingIdSeqForTests(): void {
  idSeq = 0;
}
