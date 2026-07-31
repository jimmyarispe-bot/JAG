/**
 * Universal Schema Registry (Sprint 074).
 * Schemas are the platform contract — applications register once;
 * entities, forms, workflows, search, permissions, and docs derive from them.
 * Platform ships zero domain schemas.
 */

import type { EntityCapability } from "@/lib/platform/entities/types";
import type { FormFieldType } from "@/lib/platform/forms/types";

/** Field types are generic — no StudentField / PatientField. */
export type SchemaFieldType = FormFieldType | "string" | "integer" | "json" | "uuid";

export type SchemaExtensionLayer = "base" | "application" | "organization";

export type SchemaFieldConstraint = {
  required?: boolean;
  regex?: string;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  enumValues?: string[];
  uniquenessHook?: string;
  customValidator?: string;
  message?: string;
};

export type SchemaFieldDefinition = {
  key: string;
  type: SchemaFieldType;
  label: string;
  description?: string | null;
  required?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  sortable?: boolean;
  indexed?: boolean;
  constraints?: SchemaFieldConstraint;
  defaultValue?: unknown;
  metadata?: Record<string, unknown>;
};

export type SchemaRelationshipCardinality =
  | "one"
  | "many"
  | "one_to_one"
  | "one_to_many"
  | "many_to_many";

export type SchemaRelationshipDefinition = {
  key: string;
  targetEntityType: string;
  cardinality: SchemaRelationshipCardinality;
  required?: boolean;
  inverseKey?: string | null;
  description?: string | null;
  metadata?: Record<string, unknown>;
};

export type SchemaFormRef = {
  formId: string;
  role?: "create" | "edit" | "view" | "custom" | string;
  title?: string | null;
  /** Optional inline form field keys (subset of schema fields). */
  fieldKeys?: string[];
};

export type SchemaWorkflowRef = {
  workflowId: string;
  role?: "primary" | "secondary" | "approval" | string;
  description?: string | null;
};

export type SchemaPermissionRule = {
  action: string;
  permission: string;
  description?: string;
};

export type SchemaIndexDefinition = {
  key: string;
  fields: string[];
  unique?: boolean;
  description?: string | null;
};

export type SchemaReportDefinition = {
  id: string;
  title: string;
  fields: string[];
  description?: string | null;
};

export type SchemaIntelligenceHints = {
  forecastableFields?: string[];
  reportableFields?: string[];
  searchableFields?: string[];
};

/**
 * Universal platform schema — single registration surface for applications.
 */
export type PlatformSchema = {
  id: string;
  applicationId: string | null;
  organizationId: string | null;
  entityType: string;
  version: string;
  label: string;
  description?: string | null;
  /** Parent schema id for extension hierarchy. */
  extends?: string | null;
  layer: SchemaExtensionLayer;
  fields: SchemaFieldDefinition[];
  relationships: SchemaRelationshipDefinition[];
  permissions: SchemaPermissionRule[];
  forms: SchemaFormRef[];
  workflows: SchemaWorkflowRef[];
  indexes: SchemaIndexDefinition[];
  reports: SchemaReportDefinition[];
  capabilities?: EntityCapability[];
  intelligence?: SchemaIntelligenceHints;
  metadata: Record<string, unknown>;
  /** Opaque application/org extension bag (not duplicated field defs). */
  extensions?: Record<string, unknown>;
};

export type SchemaValidationIssue = {
  path: string;
  code: string;
  message: string;
};

export type SchemaValidationResult = {
  valid: boolean;
  issues: SchemaValidationIssue[];
};

/** Resolved view after walking the extension chain. */
export type ResolvedPlatformSchema = PlatformSchema & {
  ancestors: string[];
  fieldSources: Record<string, string>;
};

export type SchemaReflection = {
  schemaId: string;
  entityType: string;
  version: string;
  layer: SchemaExtensionLayer;
  fields: SchemaFieldDefinition[];
  relationships: SchemaRelationshipDefinition[];
  forms: SchemaFormRef[];
  workflows: SchemaWorkflowRef[];
  permissions: SchemaPermissionRule[];
  indexes: SchemaIndexDefinition[];
  reports: SchemaReportDefinition[];
  capabilities: EntityCapability[];
  intelligence: SchemaIntelligenceHints;
  ancestors: string[];
};

export type SchemaDocumentation = {
  schemaId: string;
  title: string;
  markdown: string;
  fields: Array<{ key: string; type: string; label: string; description: string | null }>;
  relationships: Array<{
    key: string;
    targetEntityType: string;
    cardinality: string;
    description: string | null;
  }>;
  forms: Array<{ formId: string; role: string }>;
  workflows: Array<{ workflowId: string; role: string }>;
  permissions: Array<{ action: string; permission: string }>;
};

export type SchemaRegisterOptions = {
  /**
   * When true, project into Entity / Forms registries so frameworks
   * consume schema metadata instead of duplicated definitions.
   * Does not register or replace Workflow definitions (refs only).
   */
  syncFrameworks?: boolean;
  /** Skip structural validation (tests only). */
  skipValidation?: boolean;
};
