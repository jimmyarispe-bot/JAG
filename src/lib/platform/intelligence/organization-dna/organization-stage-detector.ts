/**
 * OrganizationStageDetector + OrganizationLifecycle (Sprint 030).
 */

import type {
  OrganizationLifecycle as OrganizationLifecycleContract,
  OrganizationStageDetector as OrganizationStageDetectorContract,
} from "@/lib/platform/intelligence/organization-dna/contracts";
import {
  detectStageFromSignals,
  nextStage,
  previousStage,
} from "@/lib/platform/intelligence/organization-dna/models";
import type {
  CompanyBuilderSeed,
  OrganizationDnaBaseline,
  OrganizationStage,
} from "@/lib/platform/intelligence/organization-dna/types";
import { ORGANIZATION_STAGES } from "@/lib/platform/intelligence/organization-dna/types";

export class OrganizationStageDetectorImpl
  implements OrganizationStageDetectorContract
{
  detect(input: {
    seed: CompanyBuilderSeed;
    baseline: OrganizationDnaBaseline;
    stageOverride?: OrganizationStage | null;
  }): OrganizationStage {
    return detectStageFromSignals(
      input.seed,
      input.baseline,
      input.stageOverride
    );
  }
}

export class OrganizationLifecycleImpl
  implements OrganizationLifecycleContract
{
  resolve(input: { stage: OrganizationStage }): {
    previous: OrganizationStage | null;
    next: OrganizationStage | null;
    transitions: OrganizationStage[];
  } {
    return {
      previous: previousStage(input.stage),
      next: nextStage(input.stage),
      transitions: [...ORGANIZATION_STAGES],
    };
  }
}

export {
  OrganizationStageDetectorImpl as OrganizationStageDetector,
};
export {
  OrganizationLifecycleImpl as OrganizationLifecycle,
};
