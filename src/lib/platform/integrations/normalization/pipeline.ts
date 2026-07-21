/**
 * Normalization pipeline:
 * Provider Payload → Validation → Normalization → Deduplication → Canonical Entity
 *
 * Framework only — provider-specific mappings come later.
 */

import type {
  Deduplicator,
  FieldMapper,
  IdentityResolver,
  NormalizationContext,
  NormalizationPipeline,
  RecordValidator,
} from "@/lib/platform/integrations/contracts";
import type { CanonicalEntity, SyncRecord } from "@/lib/platform/integrations/types";
import { createDeduplicator } from "@/lib/platform/integrations/normalization/deduplicator";
import { createIdentityResolver } from "@/lib/platform/integrations/normalization/identity";
import { createFieldMapper } from "@/lib/platform/integrations/normalization/mapper";
import { createRecordValidator } from "@/lib/platform/integrations/normalization/validator";

export type NormalizationPipelineOptions = {
  mapper?: FieldMapper;
  validator?: RecordValidator;
  deduplicator?: Deduplicator;
  identity?: IdentityResolver;
  now?: () => Date;
  createId?: (prefix: string) => string;
};

export class IntegrationNormalizationPipeline implements NormalizationPipeline {
  private readonly mapper: FieldMapper;
  private readonly validator: RecordValidator;
  private readonly deduplicator: Deduplicator;
  private readonly identity: IdentityResolver;
  private readonly now: () => Date;
  private seq = 0;
  private readonly createId: (prefix: string) => string;

  constructor(options: NormalizationPipelineOptions = {}) {
    this.mapper = options.mapper ?? createFieldMapper();
    this.validator = options.validator ?? createRecordValidator();
    this.deduplicator = options.deduplicator ?? createDeduplicator();
    this.identity = options.identity ?? createIdentityResolver();
    this.now = options.now ?? (() => new Date());
    this.createId =
      options.createId ?? ((prefix) => `${prefix}-${++this.seq}`);
  }

  run(records: readonly SyncRecord[], context: NormalizationContext) {
    const syncedAt = context.syncedAt ?? this.now().toISOString();
    const issues: { code: string; message: string; externalId?: string }[] = [];
    const candidates: CanonicalEntity[] = [];
    let rejected = 0;

    for (const record of records) {
      const data = this.mapper.map(record, context);
      const canonicalType = this.mapper.canonicalTypeFor(record.objectType);
      const identityKey = this.identity.identityKey({
        sourceSystem: context.sourceSystem,
        canonicalType,
        externalId: record.externalId,
      });
      const entity: CanonicalEntity = {
        id: this.createId("entity"),
        canonicalType,
        externalId: record.externalId,
        sourceSystem: context.sourceSystem,
        connectorId: context.connectorId,
        instanceId: context.instanceId,
        data,
        identityKey,
        contentHash: this.identity.contentHash(data),
        syncedAt,
      };

      const validation = this.validator.validate(entity);
      if (!validation.ok) {
        rejected += 1;
        for (const issue of validation.issues) {
          issues.push({ ...issue, externalId: record.externalId });
        }
        continue;
      }
      candidates.push(entity);
    }

    const { unique, duplicates } = this.deduplicator.dedupe(candidates);
    return {
      entities: unique,
      validated: unique.length,
      duplicates,
      rejected,
      issues,
    };
  }
}

export function createNormalizationPipeline(
  options?: NormalizationPipelineOptions
): IntegrationNormalizationPipeline {
  return new IntegrationNormalizationPipeline(options);
}
