/**
 * Framework integration — project PlatformSchema into Entity / Forms registries.
 * Does not replace existing app code; sync is opt-in via SchemaService.register.
 * Workflow definitions remain application-owned (schema only stores refs).
 */

import { registerEntityType } from "@/lib/platform/entities/registry";
import type {
  EntityCapability,
  EntityTypeDefinition,
  SearchableField,
} from "@/lib/platform/entities/types";
import { registerForm } from "@/lib/platform/forms/registry";
import type {
  FormDefinition,
  FormFieldDefinition,
  FormFieldType,
} from "@/lib/platform/forms/types";
import { resolveSchema } from "@/lib/platform/schema/extensions";
import type {
  PlatformSchema,
  ResolvedPlatformSchema,
  SchemaFieldDefinition,
  SchemaFieldType,
} from "@/lib/platform/schema/types";
import { getWorkflowDefinition } from "@/lib/platform/workflows/framework/registry";

const FORM_FIELD_TYPES = new Set<FormFieldType>([
  "text",
  "number",
  "currency",
  "email",
  "phone",
  "date",
  "select",
  "multiselect",
  "boolean",
  "entity_reference",
  "document_upload",
  "rich_text",
]);

function toFormFieldType(type: SchemaFieldType): FormFieldType {
  if (FORM_FIELD_TYPES.has(type as FormFieldType)) {
    return type as FormFieldType;
  }
  switch (type) {
    case "string":
    case "uuid":
      return "text";
    case "integer":
      return "number";
    case "json":
      return "rich_text";
    default:
      return "text";
  }
}

function toSearchableType(
  type: SchemaFieldType
): SearchableField["type"] {
  switch (type) {
    case "number":
    case "integer":
    case "currency":
      return "number";
    case "date":
      return "date";
    case "boolean":
      return "boolean";
    case "select":
      return "enum";
    default:
      return "string";
  }
}

function schemaFieldToFormField(
  field: SchemaFieldDefinition
): FormFieldDefinition {
  return {
    key: field.key,
    type: toFormFieldType(field.type),
    label: field.label,
    helpText: field.description ?? null,
    validation: {
      required: field.required || field.constraints?.required,
      regex: field.constraints?.regex,
      min: field.constraints?.min,
      max: field.constraints?.max,
      minLength: field.constraints?.minLength,
      maxLength: field.constraints?.maxLength,
      uniquenessHook: field.constraints?.uniquenessHook,
      customValidator: field.constraints?.customValidator,
      message: field.constraints?.message,
    },
    defaultValue: field.defaultValue,
    metadata: { ...(field.metadata ?? {}), schemaField: true },
  };
}

/**
 * Derive EntityTypeDefinition from a resolved schema.
 */
export function projectToEntityType(
  schema: PlatformSchema | ResolvedPlatformSchema
): EntityTypeDefinition {
  const resolved =
    "ancestors" in schema ? schema : resolveSchema(schema.id);

  const searchableFields: SearchableField[] = resolved.fields
    .filter((f) => f.searchable || f.indexed || f.filterable || f.sortable)
    .map((f) => ({
      key: f.key,
      label: f.label,
      type: toSearchableType(f.type),
      filterable: f.filterable,
      sortable: f.sortable,
    }));

  const hinted = resolved.intelligence?.searchableFields ?? [];
  for (const key of hinted) {
    if (searchableFields.some((f) => f.key === key)) continue;
    const field = resolved.fields.find((f) => f.key === key);
    if (!field) continue;
    searchableFields.push({
      key: field.key,
      label: field.label,
      type: toSearchableType(field.type),
      filterable: true,
    });
  }

  const defaultCapabilities: EntityCapability[] = [
    "timeline",
    "notes",
    "documents",
    "attachments",
    "tags",
    "relationships",
    "search",
    "ownership",
    "permissions",
  ];

  return {
    entityType: resolved.entityType,
    label: resolved.label,
    applicationId: resolved.applicationId,
    capabilities: resolved.capabilities?.length
      ? resolved.capabilities
      : defaultCapabilities,
    searchable: { fields: searchableFields },
    permissions: resolved.permissions.map((p) => ({
      action: p.action,
      permission: p.permission,
      description: p.description,
    })),
    metadataKeys: resolved.fields.map((f) => f.key),
  };
}

/**
 * Derive FormDefinition stubs from schema form refs + fields.
 */
export function projectToFormDefinitions(
  schema: PlatformSchema | ResolvedPlatformSchema
): FormDefinition[] {
  const resolved =
    "ancestors" in schema ? schema : resolveSchema(schema.id);

  return resolved.forms.map((formRef) => {
    const keys =
      formRef.fieldKeys && formRef.fieldKeys.length
        ? formRef.fieldKeys
        : resolved.fields.map((f) => f.key);
    const fields = keys
      .map((key) => resolved.fields.find((f) => f.key === key))
      .filter((f): f is SchemaFieldDefinition => Boolean(f))
      .map(schemaFieldToFormField);

    const primaryWorkflow = resolved.workflows.find((w) => w.role === "primary")
      ?? resolved.workflows[0];

    return {
      id: formRef.formId,
      applicationId: resolved.applicationId,
      entityType: resolved.entityType,
      version: resolved.version,
      title: formRef.title ?? `${resolved.label} (${formRef.role ?? "form"})`,
      description: resolved.description ?? null,
      sections: [
        {
          key: "main",
          title: "Main",
          fields: fields.map((f) => f.key),
        },
      ],
      fields,
      workflow: primaryWorkflow
        ? {
            startOnSubmit: primaryWorkflow.workflowId,
            attachDocuments: true,
            recordTimeline: true,
          }
        : null,
      permissions: resolved.permissions
        .filter((p) =>
          ["view", "submit", "edit"].includes(p.action)
        )
        .map((p) => ({
          action: p.action as "view" | "submit" | "edit",
          permission: p.permission,
        })),
      metadata: {
        derivedFromSchema: resolved.id,
        formRole: formRef.role ?? "custom",
      },
    };
  });
}

export type SchemaSyncResult = {
  entityType: string | null;
  formIds: string[];
  workflowIds: string[];
  missingWorkflows: string[];
};

/**
 * Sync resolved schema into Entity + Forms registries.
 * Workflows are referenced only — not created or replaced.
 */
export function syncSchemaToFrameworks(
  schemaId: string
): SchemaSyncResult {
  const resolved = resolveSchema(schemaId);

  const entityDef = projectToEntityType(resolved);
  registerEntityType(entityDef);

  const forms = projectToFormDefinitions(resolved);
  const formIds: string[] = [];
  for (const form of forms) {
    if (!form.fields.length) continue;
    registerForm(form);
    formIds.push(form.id);
  }

  const workflowIds: string[] = [];
  const missingWorkflows: string[] = [];
  for (const wf of resolved.workflows) {
    workflowIds.push(wf.workflowId);
    if (!getWorkflowDefinition(wf.workflowId)) {
      missingWorkflows.push(wf.workflowId);
    }
  }

  return {
    entityType: entityDef.entityType,
    formIds,
    workflowIds,
    missingWorkflows,
  };
}

/** Read-only: schema fields available for forecasting/reporting consumers. */
export function schemaIntelligenceSurface(schemaId: string): {
  forecastableFields: string[];
  reportableFields: string[];
  searchableFields: string[];
  reportIds: string[];
} {
  const resolved = resolveSchema(schemaId);
  return {
    forecastableFields:
      resolved.intelligence?.forecastableFields ??
      resolved.fields.filter((f) => f.type === "number" || f.type === "currency").map((f) => f.key),
    reportableFields:
      resolved.intelligence?.reportableFields ??
      resolved.reports.flatMap((r) => r.fields),
    searchableFields:
      resolved.intelligence?.searchableFields ??
      resolved.fields.filter((f) => f.searchable).map((f) => f.key),
    reportIds: resolved.reports.map((r) => r.id),
  };
}
