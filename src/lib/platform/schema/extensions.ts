import { getRegisteredSchema } from "@/lib/platform/schema/registry";
import { mergeFieldConstraints } from "@/lib/platform/schema/constraints";
import type {
  PlatformSchema,
  ResolvedPlatformSchema,
  SchemaFieldDefinition,
  SchemaFormRef,
  SchemaIndexDefinition,
  SchemaPermissionRule,
  SchemaRelationshipDefinition,
  SchemaReportDefinition,
  SchemaValidationIssue,
  SchemaWorkflowRef,
} from "@/lib/platform/schema/types";

const LAYER_ORDER = {
  base: 0,
  application: 1,
  organization: 2,
} as const;

function mergeByKey<T>(
  base: T[],
  overlay: T[],
  keyOf: (item: T) => string
): T[] {
  const map = new Map<string, T>();
  for (const item of base) map.set(keyOf(item), item);
  for (const item of overlay) map.set(keyOf(item), item);
  return [...map.values()];
}

function mergeFields(
  base: SchemaFieldDefinition[],
  overlay: SchemaFieldDefinition[],
  fieldSources: Record<string, string>,
  sourceId: string
): SchemaFieldDefinition[] {
  const map = new Map<string, SchemaFieldDefinition>();
  for (const f of base) map.set(f.key, f);
  for (const f of overlay) {
    const prev = map.get(f.key);
    if (prev) {
      map.set(f.key, {
        ...prev,
        ...f,
        constraints: mergeFieldConstraints(prev.constraints, f.constraints),
        metadata: { ...(prev.metadata ?? {}), ...(f.metadata ?? {}) },
      });
    } else {
      map.set(f.key, f);
    }
    fieldSources[f.key] = sourceId;
  }
  for (const f of base) {
    if (!fieldSources[f.key]) fieldSources[f.key] = "ancestor";
  }
  return [...map.values()];
}

/**
 * Walk extends chain (child → parent) and return ordered ancestors (nearest first).
 */
export function getExtensionChain(schemaId: string): PlatformSchema[] {
  const chain: PlatformSchema[] = [];
  const seen = new Set<string>();
  let current = getRegisteredSchema(schemaId);
  while (current) {
    if (seen.has(current.id)) {
      throw new Error(
        `Schema extension cycle detected at "${current.id}"`
      );
    }
    seen.add(current.id);
    chain.push(current);
    if (!current.extends) break;
    current = getRegisteredSchema(current.extends);
  }
  return chain;
}

/**
 * Resolve Base → Application → Organization into a single effective schema.
 * Child overlays win; fields merge by key without duplication.
 */
export function resolveSchema(schemaId: string): ResolvedPlatformSchema {
  const chain = getExtensionChain(schemaId);
  if (!chain.length) {
    throw new Error(`Schema "${schemaId}" is not registered`);
  }

  // Resolve from root (base) to leaf (organization)
  const ordered = [...chain].reverse();
  const leaf = chain[0]!;
  const fieldSources: Record<string, string> = {};

  let fields: SchemaFieldDefinition[] = [];
  let relationships: SchemaRelationshipDefinition[] = [];
  let permissions: SchemaPermissionRule[] = [];
  let forms: SchemaFormRef[] = [];
  let workflows: SchemaWorkflowRef[] = [];
  let indexes: SchemaIndexDefinition[] = [];
  let reports: SchemaReportDefinition[] = [];
  let capabilities = new Set<string>();
  let extensions: Record<string, unknown> = {};
  let metadata: Record<string, unknown> = {};
  let intelligence = {
    forecastableFields: [] as string[],
    reportableFields: [] as string[],
    searchableFields: [] as string[],
  };

  for (const node of ordered) {
    fields = mergeFields(fields, node.fields, fieldSources, node.id);
    relationships = mergeByKey(
      relationships,
      node.relationships,
      (r) => r.key
    );
    permissions = mergeByKey(
      permissions,
      node.permissions,
      (p) => `${p.action}:${p.permission}`
    );
    forms = mergeByKey(forms, node.forms, (f) => f.formId);
    workflows = mergeByKey(workflows, node.workflows, (w) => w.workflowId);
    indexes = mergeByKey(indexes, node.indexes, (i) => i.key);
    reports = mergeByKey(reports, node.reports, (r) => r.id);
    for (const c of node.capabilities ?? []) capabilities.add(c);
    extensions = { ...extensions, ...(node.extensions ?? {}) };
    metadata = { ...metadata, ...node.metadata };
    if (node.intelligence) {
      intelligence = {
        forecastableFields: uniqueStrings([
          ...intelligence.forecastableFields,
          ...(node.intelligence.forecastableFields ?? []),
        ]),
        reportableFields: uniqueStrings([
          ...intelligence.reportableFields,
          ...(node.intelligence.reportableFields ?? []),
        ]),
        searchableFields: uniqueStrings([
          ...intelligence.searchableFields,
          ...(node.intelligence.searchableFields ?? []),
        ]),
      };
    }
  }

  return {
    ...leaf,
    fields,
    relationships,
    permissions,
    forms,
    workflows,
    indexes,
    reports,
    capabilities: [...capabilities] as ResolvedPlatformSchema["capabilities"],
    intelligence,
    extensions,
    metadata,
    ancestors: chain.slice(1).map((s) => s.id),
    fieldSources,
  };
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)];
}

export function validateExtensionHierarchy(
  schema: PlatformSchema
): SchemaValidationIssue[] {
  const issues: SchemaValidationIssue[] = [];

  if (schema.extends) {
    const parent = getRegisteredSchema(schema.extends);
    if (!parent) {
      issues.push({
        path: "extends",
        code: "missing_parent",
        message: `Parent schema "${schema.extends}" is not registered`,
      });
      return issues;
    }

    if (LAYER_ORDER[schema.layer] <= LAYER_ORDER[parent.layer]) {
      issues.push({
        path: "layer",
        code: "invalid_extension_layer",
        message: `Schema layer "${schema.layer}" cannot extend "${parent.layer}"`,
      });
    }

    if (schema.entityType !== parent.entityType) {
      issues.push({
        path: "entityType",
        code: "extension_entity_mismatch",
        message: `Extension entityType "${schema.entityType}" must match parent "${parent.entityType}"`,
      });
    }

    // Type conflicts on overridden fields
    const parentFields = new Map(parent.fields.map((f) => [f.key, f]));
    for (const field of schema.fields) {
      const base = parentFields.get(field.key);
      if (base && base.type !== field.type) {
        issues.push({
          path: `fields.${field.key}.type`,
          code: "extension_type_conflict",
          message: `Field "${field.key}" type conflict: parent="${base.type}" child="${field.type}"`,
        });
      }
    }
  } else if (schema.layer !== "base") {
    issues.push({
      path: "extends",
      code: "missing_extends",
      message: `Layer "${schema.layer}" schemas must set extends to a parent schema`,
    });
  }

  return issues;
}
