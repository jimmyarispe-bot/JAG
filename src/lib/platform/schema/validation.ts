import {
  fieldKeysUnique,
  validateFieldConstraints,
} from "@/lib/platform/schema/constraints";
import { validateExtensionHierarchy } from "@/lib/platform/schema/extensions";
import {
  getRegisteredSchema,
  listRegisteredSchemas,
  putSchema,
  removeSchema,
} from "@/lib/platform/schema/registry";
import { findRelationshipCycles } from "@/lib/platform/schema/relationships";
import type {
  PlatformSchema,
  SchemaValidationIssue,
  SchemaValidationResult,
} from "@/lib/platform/schema/types";
import { getFormDefinition } from "@/lib/platform/forms/registry";
import { getWorkflowDefinition } from "@/lib/platform/workflows/framework/registry";

function validateIndexes(schema: PlatformSchema): SchemaValidationIssue[] {
  const issues: SchemaValidationIssue[] = [];
  const fieldKeys = new Set(schema.fields.map((f) => f.key));
  const indexKeys = new Set<string>();

  for (const index of schema.indexes) {
    if (indexKeys.has(index.key)) {
      issues.push({
        path: `indexes.${index.key}`,
        code: "duplicate_index",
        message: `Duplicate index key "${index.key}"`,
      });
    }
    indexKeys.add(index.key);
    for (const field of index.fields) {
      if (!fieldKeys.has(field)) {
        issues.push({
          path: `indexes.${index.key}.fields`,
          code: "invalid_index_field",
          message: `Index "${index.key}" references unknown field "${field}"`,
        });
      }
    }
  }
  return issues;
}

function validateReports(schema: PlatformSchema): SchemaValidationIssue[] {
  const issues: SchemaValidationIssue[] = [];
  const fieldKeys = new Set(schema.fields.map((f) => f.key));
  const reportIds = new Set<string>();

  for (const report of schema.reports) {
    if (reportIds.has(report.id)) {
      issues.push({
        path: `reports.${report.id}`,
        code: "duplicate_report",
        message: `Duplicate report id "${report.id}"`,
      });
    }
    reportIds.add(report.id);
    for (const field of report.fields) {
      if (!fieldKeys.has(field)) {
        issues.push({
          path: `reports.${report.id}.fields`,
          code: "invalid_report_field",
          message: `Report "${report.id}" references unknown field "${field}"`,
        });
      }
    }
  }
  return issues;
}

function validateForms(schema: PlatformSchema): SchemaValidationIssue[] {
  const issues: SchemaValidationIssue[] = [];
  const fieldKeys = new Set(schema.fields.map((f) => f.key));
  const formIds = new Set<string>();

  for (const form of schema.forms) {
    if (formIds.has(form.formId)) {
      issues.push({
        path: `forms.${form.formId}`,
        code: "duplicate_form_ref",
        message: `Duplicate form reference "${form.formId}"`,
      });
    }
    formIds.add(form.formId);
    for (const key of form.fieldKeys ?? []) {
      if (!fieldKeys.has(key)) {
        issues.push({
          path: `forms.${form.formId}.fieldKeys`,
          code: "invalid_form_field",
          message: `Form "${form.formId}" references unknown field "${key}"`,
        });
      }
    }
  }
  return issues;
}

function validateRelationships(schema: PlatformSchema): SchemaValidationIssue[] {
  const issues: SchemaValidationIssue[] = [];
  const keys = new Set<string>();
  for (const rel of schema.relationships) {
    if (keys.has(rel.key)) {
      issues.push({
        path: `relationships.${rel.key}`,
        code: "duplicate_relationship",
        message: `Duplicate relationship key "${rel.key}"`,
      });
    }
    keys.add(rel.key);
    if (!rel.targetEntityType.trim()) {
      issues.push({
        path: `relationships.${rel.key}.targetEntityType`,
        code: "missing_relationship_target",
        message: `Relationship "${rel.key}" missing targetEntityType`,
      });
    }
  }
  return issues;
}

function validatePermissions(schema: PlatformSchema): SchemaValidationIssue[] {
  const issues: SchemaValidationIssue[] = [];
  for (const rule of schema.permissions) {
    if (!rule.action.trim() || !rule.permission.trim()) {
      issues.push({
        path: "permissions",
        code: "invalid_permission",
        message: "Permission rules require non-empty action and permission",
      });
    }
  }
  return issues;
}

function validateExternalReferences(
  schema: PlatformSchema
): SchemaValidationIssue[] {
  const issues: SchemaValidationIssue[] = [];

  for (const form of schema.forms) {
    const existing = getFormDefinition(form.formId);
    if (
      existing &&
      existing.entityType &&
      existing.entityType !== schema.entityType
    ) {
      issues.push({
        path: `forms.${form.formId}`,
        code: "form_entity_mismatch",
        message: `Form "${form.formId}" is registered for entity "${existing.entityType}", not "${schema.entityType}"`,
      });
    }
  }

  for (const wf of schema.workflows) {
    const def = getWorkflowDefinition(wf.workflowId);
    if (!def) {
      issues.push({
        path: `workflows.${wf.workflowId}`,
        code: "missing_workflow_target",
        message: `Workflow "${wf.workflowId}" is not registered`,
      });
      continue;
    }
    if (
      def.entityTypes.length > 0 &&
      !def.entityTypes.includes(schema.entityType)
    ) {
      issues.push({
        path: `workflows.${wf.workflowId}`,
        code: "workflow_entity_mismatch",
        message: `Workflow "${wf.workflowId}" does not allow entityType "${schema.entityType}"`,
      });
    }
  }

  return issues;
}

/**
 * Validate a schema definition (optionally against registries).
 */
export function validatePlatformSchema(
  schema: PlatformSchema,
  options?: { checkReferences?: boolean; checkCycles?: boolean }
): SchemaValidationResult {
  const issues: SchemaValidationIssue[] = [];

  if (!schema.id?.trim()) {
    issues.push({
      path: "id",
      code: "required",
      message: "id is required",
    });
  }
  if (!schema.entityType?.trim()) {
    issues.push({
      path: "entityType",
      code: "required",
      message: "entityType is required",
    });
  }

  issues.push(...fieldKeysUnique(schema.fields));
  for (const field of schema.fields) {
    if (!field.key.trim()) {
      issues.push({
        path: "fields",
        code: "invalid_field_key",
        message: "Field key is required",
      });
    }
    issues.push(...validateFieldConstraints(field));
  }

  issues.push(...validateRelationships(schema));
  issues.push(...validateForms(schema));
  issues.push(...validateIndexes(schema));
  issues.push(...validateReports(schema));
  issues.push(...validatePermissions(schema));
  issues.push(...validateExtensionHierarchy(schema));

  if (options?.checkReferences !== false) {
    issues.push(...validateExternalReferences(schema));
  }

  if (options?.checkCycles) {
    const prior = getRegisteredSchema(schema.id);
    putSchema(schema);
    const cycles = findRelationshipCycles();
    if (!prior) removeSchema(schema.id);
    else putSchema(prior);
    for (const cycle of cycles) {
      issues.push({
        path: "relationships",
        code: "relationship_cycle",
        message: `Relationship cycle detected: ${cycle.join(" → ")}`,
      });
    }
  }

  const existing = getRegisteredSchema(schema.id);
  if (existing && existing.entityType !== schema.entityType) {
    issues.push({
      path: "id",
      code: "schema_id_conflict",
      message: `Schema id "${schema.id}" already registered for entityType "${existing.entityType}"`,
    });
  }

  const peers = listRegisteredSchemas({
    entityType: schema.entityType,
    layer: schema.layer,
  }).filter((s) => s.id !== schema.id);
  for (const peer of peers) {
    if (
      peer.applicationId === schema.applicationId &&
      peer.organizationId === schema.organizationId
    ) {
      issues.push({
        path: "entityType",
        code: "duplicate_schema_scope",
        message: `Another schema "${peer.id}" already covers entityType "${schema.entityType}" at layer "${schema.layer}"`,
      });
    }
  }

  return { valid: issues.length === 0, issues };
}
