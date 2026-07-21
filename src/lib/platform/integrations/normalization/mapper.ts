/**
 * Field mapper — provider-agnostic mapping hooks.
 * Provider-specific field maps are supplied by connectors later.
 */

import type { FieldMapper, NormalizationContext } from "@/lib/platform/integrations/contracts";
import type { SyncRecord } from "@/lib/platform/integrations/types";

export type FieldMap = Record<string, string>;

export type MapperOptions = {
  fieldMaps?: Record<string, FieldMap>;
  canonicalTypeFor?: (objectType: string) => string;
};

export class DefaultFieldMapper implements FieldMapper {
  constructor(private readonly options: MapperOptions = {}) {}

  map(record: SyncRecord, _context: NormalizationContext): Record<string, unknown> {
    const fieldMap = this.options.fieldMaps?.[record.objectType];
    if (!fieldMap) return { ...record.payload };
    return applyFieldMap(record.payload, fieldMap);
  }

  canonicalTypeFor(objectType: string): string {
    return this.options.canonicalTypeFor?.(objectType) ?? objectType;
  }
}

export function applyFieldMap(
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

export function createFieldMapper(options?: MapperOptions): DefaultFieldMapper {
  return new DefaultFieldMapper(options);
}
