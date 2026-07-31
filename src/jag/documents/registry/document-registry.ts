import {
  assertAllowedClassification,
  assertUniversalClassification,
} from "@/jag/documents/classification";
import type {
  DocumentCategory,
  DocumentDefinition,
  DocumentTemplate,
} from "@/jag/documents/contracts/definitions";

const definitions = new Map<string, DocumentDefinition>();
const categories = new Map<string, DocumentCategory>();
const templates = new Map<string, DocumentTemplate>();

function validateDefinition(definition: DocumentDefinition): void {
  if (!definition.id.trim()) {
    throw new Error("DocumentDefinition.id is required");
  }
  if (!definition.applicationId.trim()) {
    throw new Error(`Document "${definition.id}" requires applicationId`);
  }
  if (!definition.version.trim()) {
    throw new Error(`Document "${definition.id}" requires version`);
  }
  if (!definition.categoryId.trim()) {
    throw new Error(`Document "${definition.id}" requires categoryId`);
  }
  assertAllowedClassification(definition, definition.defaultClassification);

  if (definition.allowedClassifications) {
    for (const c of definition.allowedClassifications) {
      assertUniversalClassification(c);
    }
  }
}

function validateDependencies(definition: DocumentDefinition): void {
  for (const dep of definition.dependsOn ?? []) {
    if (!definitions.has(dep)) {
      throw new Error(
        `Document "${definition.id}" depends on unregistered document "${dep}"`
      );
    }
  }
}

function freezeDefinition(definition: DocumentDefinition): DocumentDefinition {
  return Object.freeze({
    ...definition,
    allowedClassifications: definition.allowedClassifications
      ? Object.freeze([...definition.allowedClassifications])
      : undefined,
    templateIds: definition.templateIds
      ? Object.freeze([...definition.templateIds])
      : undefined,
    permissions: definition.permissions
      ? Object.freeze(definition.permissions.map((p) => Object.freeze({ ...p })))
      : undefined,
    dependsOn: definition.dependsOn
      ? Object.freeze([...definition.dependsOn])
      : undefined,
    metadataSchema: definition.metadataSchema
      ? Object.freeze({ ...definition.metadataSchema })
      : undefined,
    extensions: definition.extensions
      ? Object.freeze({ ...definition.extensions })
      : undefined,
  });
}

export function registerDocumentCategory(
  category: DocumentCategory
): DocumentCategory {
  if (!category.id.trim()) throw new Error("DocumentCategory.id is required");
  if (categories.has(category.id)) {
    throw new Error(`Document category "${category.id}" is already registered`);
  }
  const frozen = Object.freeze({ ...category });
  categories.set(frozen.id, frozen);
  return frozen;
}

export function registerDocumentTemplate(
  template: DocumentTemplate
): DocumentTemplate {
  if (!template.id.trim()) throw new Error("DocumentTemplate.id is required");
  if (!definitions.has(template.definitionId)) {
    throw new Error(
      `Document template "${template.id}" references unregistered definition "${template.definitionId}"`
    );
  }
  if (templates.has(template.id)) {
    throw new Error(`Document template "${template.id}" is already registered`);
  }
  const frozen = Object.freeze({
    ...template,
    defaultMetadata: template.defaultMetadata
      ? Object.freeze({ ...template.defaultMetadata })
      : undefined,
  });
  templates.set(frozen.id, frozen);
  return frozen;
}

export function registerDocument(
  definition: DocumentDefinition
): DocumentDefinition {
  validateDefinition(definition);
  if (definitions.has(definition.id)) {
    throw new Error(
      `Document "${definition.id}" is already registered. Document ids must be unique.`
    );
  }
  if (!categories.has(definition.categoryId)) {
    throw new Error(
      `Document "${definition.id}" references unknown category "${definition.categoryId}"`
    );
  }
  validateDependencies(definition);
  const frozen = freezeDefinition(definition);
  definitions.set(frozen.id, frozen);
  return frozen;
}

export function getDocumentDefinition(
  id: string
): DocumentDefinition | null {
  return definitions.get(id) ?? null;
}

export function listDocumentDefinitions(filter?: {
  applicationId?: string;
  categoryId?: string;
}): DocumentDefinition[] {
  let all = [...definitions.values()].sort((a, b) => a.id.localeCompare(b.id));
  if (filter?.applicationId) {
    all = all.filter((d) => d.applicationId === filter.applicationId);
  }
  if (filter?.categoryId) {
    all = all.filter((d) => d.categoryId === filter.categoryId);
  }
  return all;
}

export function assertDocumentRegistered(id: string): DocumentDefinition {
  const def = getDocumentDefinition(id);
  if (!def) {
    throw new Error(
      `Document "${id}" is not registered. Packages must registerDocument().`
    );
  }
  return def;
}

export function getDocumentCategory(id: string): DocumentCategory | null {
  return categories.get(id) ?? null;
}

export function listDocumentCategories(): DocumentCategory[] {
  return [...categories.values()].sort((a, b) => a.id.localeCompare(b.id));
}

export function getDocumentTemplate(id: string): DocumentTemplate | null {
  return templates.get(id) ?? null;
}

export function listDocumentTemplates(filter?: {
  definitionId?: string;
}): DocumentTemplate[] {
  let all = [...templates.values()].sort((a, b) => a.id.localeCompare(b.id));
  if (filter?.definitionId) {
    all = all.filter((t) => t.definitionId === filter.definitionId);
  }
  return all;
}

export function validateDocumentRegistryDependencies(): string[] {
  const errors: string[] = [];
  for (const def of definitions.values()) {
    for (const dep of def.dependsOn ?? []) {
      if (!definitions.has(dep)) {
        errors.push(`Document "${def.id}" depends on missing "${dep}"`);
      }
    }
  }
  return errors;
}

export function resetDocumentRegistryForTests(): void {
  definitions.clear();
  categories.clear();
  templates.clear();
}

export const DocumentRegistry = {
  register: registerDocument,
  registerCategory: registerDocumentCategory,
  registerTemplate: registerDocumentTemplate,
  get: getDocumentDefinition,
  list: listDocumentDefinitions,
  assert: assertDocumentRegistered,
  getCategory: getDocumentCategory,
  listCategories: listDocumentCategories,
  getTemplate: getDocumentTemplate,
  listTemplates: listDocumentTemplates,
  validateDependencies: validateDocumentRegistryDependencies,
  resetForTests: resetDocumentRegistryForTests,
} as const;
