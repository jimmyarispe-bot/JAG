/**
 * Normalization pipeline contracts.
 * Raw provider payloads never enter JAG intelligence directly.
 */

import type { CanonicalEntity, SyncRecord } from "@/lib/platform/integrations/types";

export interface NormalizationContext {
  readonly connectorId: string;
  readonly instanceId: string;
  readonly sourceSystem: string;
  readonly syncedAt?: string;
}

export interface FieldMapper {
  map(record: SyncRecord, context: NormalizationContext): Record<string, unknown>;
  canonicalTypeFor(objectType: string): string;
}

export interface RecordValidator {
  validate(
    entity: CanonicalEntity
  ): { ok: boolean; issues: readonly { code: string; message: string }[] };
}

export interface Deduplicator {
  dedupe(entities: readonly CanonicalEntity[]): {
    unique: CanonicalEntity[];
    duplicates: number;
  };
}

export interface IdentityResolver {
  identityKey(input: {
    sourceSystem: string;
    canonicalType: string;
    externalId: string;
  }): string;
  contentHash(data: Record<string, unknown>): string;
}

export interface NormalizationPipeline {
  run(
    records: readonly SyncRecord[],
    context: NormalizationContext
  ): {
    entities: CanonicalEntity[];
    validated: number;
    duplicates: number;
    rejected: number;
    issues: readonly { code: string; message: string; externalId?: string }[];
  };
}
