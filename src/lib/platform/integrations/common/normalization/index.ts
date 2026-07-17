/**
 * Normalization — map vendor SyncRecords to canonical NormalizedRecords.
 */

import type {
  ConnectorConfiguration,
  NormalizedRecord,
  SyncRecord,
} from "@/lib/platform/integrations/common/types";

export type FieldMap = Record<string, string>;

export function normalizeRecords(
  records: SyncRecord[],
  config: ConnectorConfiguration,
  options: {
    connectorId: string;
    sourceSystem: string;
    canonicalTypeFor: (objectType: string) => string;
    fieldMaps?: Record<string, FieldMap>;
  }
): NormalizedRecord[] {
  const syncedAt = new Date().toISOString();
  return records.map((record) => {
    const fieldMap = options.fieldMaps?.[record.objectType];
    const data = fieldMap ? applyFieldMap(record.payload, fieldMap) : { ...record.payload };
    return {
      canonicalType: options.canonicalTypeFor(record.objectType),
      externalId: record.externalId,
      sourceSystem: options.sourceSystem,
      scope: config.scope,
      data,
      lineage: {
        connectorId: options.connectorId,
        instanceId: config.instanceId,
        syncedAt,
      },
    };
  });
}

function applyFieldMap(
  payload: Record<string, unknown>,
  fieldMap: FieldMap
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [source, target] of Object.entries(fieldMap)) {
    if (source in payload) out[target] = payload[source];
  }
  for (const [key, value] of Object.entries(payload)) {
    if (!(key in fieldMap) && !(key in out)) out[key] = value;
  }
  return out;
}
