import type { EntityImporter, FieldMapping, ImportFieldDefinition } from "../types";

function normalizeHeader(value: string): string {
  return value
    .toLowerCase()
    .replace(/^\uFEFF/, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Leading qualifiers that say WHOSE field a column is.
 *
 * A spreadsheet column called "Parent First Name" normalizes to
 * `parent_first_name`, which literally contains `first_name` -- the student's
 * own field. Before this guard a fuzzy substring match scored that pairing 0.75
 * and the parent's name was silently written into the child's name column.
 *
 * Qualifiers are grouped so that `parent` and `guardian` are interchangeable,
 * and `student` and `child` are interchangeable, but the two groups never are.
 */
const QUALIFIER_GROUPS: Record<string, "adult" | "child"> = {
  parent: "adult",
  guardian: "adult",
  mother: "adult",
  father: "adult",
  contact: "adult",
  student: "child",
  child: "child",
};

/** The qualifier group a normalized header/alias belongs to, or null if none. */
function qualifierGroup(normalized: string): "adult" | "child" | null {
  const first = normalized.split("_")[0];
  if (!first) return null;
  return QUALIFIER_GROUPS[first] ?? null;
}

function scoreMatch(source: string, field: ImportFieldDefinition): number {
  const normSource = normalizeHeader(source);
  const candidates = [field.key, field.label, ...(field.aliases ?? [])].map(normalizeHeader);

  // Exact matches are trusted as-is.
  if (candidates.includes(normSource)) return 1;

  const sourceQualifier = qualifierGroup(normSource);
  for (const candidate of candidates) {
    if (!candidate) continue;
    if (!(normSource.includes(candidate) || candidate.includes(normSource))) continue;
    // A substring match may not cross a qualifier boundary. If one side names an
    // adult and the other does not (or names the child), the columns are about
    // different people and the match is disqualified rather than downscored.
    if (sourceQualifier !== qualifierGroup(candidate)) continue;
    return 0.75;
  }
  return 0;
}

/** Auto-map source headers to importer target fields. */
export function autoMapColumns(
  headers: string[],
  fields: ImportFieldDefinition[]
): FieldMapping[] {
  const usedTargets = new Set<string>();
  const usedSources = new Set<string>();
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
      // One source column may fill exactly one target field. Without this a
      // single column could be consumed twice -- once at 1.0 by the field it
      // really belongs to, and again at 0.75 by a field it merely resembles.
      if (usedSources.has(match.sourceField)) return;
      usedTargets.add(match.field.key);
      usedSources.add(match.sourceField);
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
