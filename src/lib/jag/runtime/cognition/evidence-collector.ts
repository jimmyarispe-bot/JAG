import type { RuntimeEventBus } from "../events";
import {
  COGNITION_EVENT_TYPES,
  type EvidenceCollectedPayload,
  type ProviderFailedPayload,
} from "./cognition-events";
import type { CognitiveProvider } from "./cognitive-provider";
import type {
  CognitiveEvidenceRef,
  CognitiveThinkRequest,
} from "./cognition-types";

export interface EvidenceCollectionResult {
  evidence: CognitiveEvidenceRef[];
  consultedProviderIds: string[];
  failed: { providerId: string; reason: string }[];
}

export class EvidenceCollector {
  constructor(private readonly events?: RuntimeEventBus) {}

  async collect(
    request: CognitiveThinkRequest,
    providers: readonly CognitiveProvider[]
  ): Promise<EvidenceCollectionResult> {
    const evidence: CognitiveEvidenceRef[] = [];
    const consultedProviderIds: string[] = [];
    const failed: { providerId: string; reason: string }[] = [];
    const seen = new Set<string>();

    for (const provider of providers) {
      if (request.signal?.aborted) break;
      if (provider.supports && !provider.supports(request)) continue;
      if (!provider.gatherEvidence) continue;
      consultedProviderIds.push(provider.id);
      try {
        const refs = await provider.gatherEvidence(request);
        for (const ref of refs) {
          const key = `${ref.source}:${ref.id}`;
          if (seen.has(key)) continue;
          seen.add(key);
          evidence.push(ref);
        }
      } catch (error) {
        const reason =
          error instanceof Error ? error.message : "Evidence gather failed";
        failed.push({ providerId: provider.id, reason });
        const payload: ProviderFailedPayload = {
          providerId: provider.id,
          reason,
        };
        await this.events?.publish(
          COGNITION_EVENT_TYPES.PROVIDER_FAILED,
          payload
        );
      }
    }

    const collectedPayload: EvidenceCollectedPayload = {
      count: evidence.length,
      providerIds: consultedProviderIds,
    };
    await this.events?.publish(
      COGNITION_EVENT_TYPES.EVIDENCE_COLLECTED,
      collectedPayload
    );

    return { evidence, consultedProviderIds, failed };
  }
}

export function createEvidenceCollector(
  events?: RuntimeEventBus
): EvidenceCollector {
  return new EvidenceCollector(events);
}
