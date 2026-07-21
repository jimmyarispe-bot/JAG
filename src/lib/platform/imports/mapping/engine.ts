import type { EntityImporter, FieldMapping, ImportFieldDefinition } from "../types";

function normalizeHeader(value: string): string {
  return value
    .toLowerCase()
    .replace(/^\uFEFF/, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function scoreMatch(source: string, field: ImportFieldDefinition): number {
  const normSource = normalizeHeader(source);
  const candidates = [field.key, field.label, ...(field.aliases ?? [])].map(normalizeHeader);

  if (candidates.includes(normSource)) return 1;
  for (const candidate of candidates) {
    if (!candidate) continue;
    if (normSource.includes(candidate) || candidate.includes(normSource)) {
      return 0.75;
    }
  }
  return 0;
}

/** Auto-map source headers to importer target fields. */
export function autoMapColumns(
  headers: string[],
  fields: ImportFieldDefinition[]
): FieldMapping[] {
  const usedTargets = new Set<string>();
  const mappings: FieldMapping[] = [];

  const scored = headers.flatMap((sourceField) =>
    fields.map((field) => ({
      sourceField,
      field,
      confidence: scoreMatch(sourceField, field),
    }))
  );

  scored
    .filter((s) => s.confidence > 0)
    .sort((a, b) => b.confidence - a.confidence)
    .forEach((match) => {
      if (usedTargets.has(match.field.key)) return;
      usedTargets.add(match.field.key);
      mappings.push({
        sourceField: match.sourceField,
        targetField: match.field.key,
        required: match.field.required,
        confidence: match.confidence,
      });
    });

  // Ensure required fields appear even if unmatched (empty source)
  for (const field of fields.filter((f) => f.required)) {
    if (usedTargets.has(field.key)) continue;
    mappings.push({
      sourceField: "",
      targetField: field.key,
      required: true,
      confidence: 0,
    });
  }

  return mappings;
}

export function applyTransform(value: unknown, transform?: string): unknown {
  if (value == null) return value;
  const str = String(value);
  if (!transform) return str.trim();
  if (transform === "uppercase") return str.trim().toUpperCase();
  if (transform === "lowercase") return str.trim().toLowerCase();
  if (transform === "trim") return str.trim();
  if (transform.startsWith("default:")) return str.trim() || transform.slice(8);
  return str.trim();
}

export function mapRecord(
  raw: Record<string, string>,
  mappings: FieldMapping[]
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const mapping of mappings) {
    if (!mapping.targetField) continue;
    const sourceValue =
      (mapping.sourceField && raw[mapping.sourceField] !== undefined
        ? raw[mapping.sourceField]
        : undefined) ??
      mapping.defaultValue ??
      "";
    result[mapping.targetField] = applyTransform(sourceValue, mapping.transform);
  }
  return result;
}

export function buildMappingsFromImporter(
  importer: EntityImporter,
  headers: string[],
  overrides?: FieldMapping[]
): FieldMapping[] {
  if (overrides?.length) return overrides;
  return autoMapColumns(headers, importer.fields);
}

export function unmappedRequiredFields(
  mappings: FieldMapping[],
  fields: ImportFieldDefinition[]
): string[] {
  const mapped = new Set(
    mappings.filter((m) => m.sourceField).map((m) => m.targetField)
  );
  return fields.filter((f) => f.required && !mapped.has(f.key)).map((f) => f.key);
}
