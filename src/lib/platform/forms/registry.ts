import type { FormDefinition } from "@/lib/platform/forms/types";

const registry = new Map<string, FormDefinition>();

export function resetFormRegistryForTests(): void {
  registry.clear();
}

/**
 * Applications register form schemas.
 * Platform ships with zero forms.
 */
export function registerForm(definition: FormDefinition): FormDefinition {
  if (!definition.id.trim()) throw new Error("FormDefinition.id is required");
  if (!definition.fields.length) {
    throw new Error(`Form "${definition.id}" must declare at least one field`);
  }
  const fieldKeys = new Set(definition.fields.map((f) => f.key));
  for (const section of definition.sections) {
    for (const key of section.fields) {
      if (!fieldKeys.has(key)) {
        throw new Error(
          `Form "${definition.id}" section "${section.key}" references unknown field "${key}"`
        );
      }
    }
  }
  const normalized: FormDefinition = {
    ...definition,
    id: definition.id.trim(),
    sections: definition.sections.map((s) => ({
      ...s,
      fields: [...s.fields],
      metadata: { ...(s.metadata ?? {}) },
    })),
    fields: definition.fields.map((f) => ({
      ...f,
      options: f.options?.map((o) => ({ ...o })),
      validation: f.validation ? { ...f.validation } : undefined,
      metadata: { ...(f.metadata ?? {}) },
    })),
    permissions: definition.permissions.map((p) => ({ ...p })),
    workflow: definition.workflow
      ? structuredClone(definition.workflow)
      : null,
    metadata: { ...definition.metadata },
  };
  registry.set(normalized.id, normalized);
  return normalized;
}

export function unregisterForm(formId: string): boolean {
  return registry.delete(formId);
}

export function getFormDefinition(formId: string): FormDefinition | null {
  return registry.get(formId) ?? null;
}

export function listFormDefinitions(filter?: {
  applicationId?: string | null;
  entityType?: string | null;
}): FormDefinition[] {
  let rows = [...registry.values()];
  if (filter?.applicationId !== undefined) {
    rows = rows.filter(
      (f) =>
        f.applicationId === filter.applicationId || f.applicationId == null
    );
  }
  if (filter?.entityType !== undefined) {
    rows = rows.filter((f) => f.entityType === filter.entityType);
  }
  return rows.sort((a, b) => a.id.localeCompare(b.id));
}

export function assertFormRegistered(formId: string): FormDefinition {
  const def = getFormDefinition(formId);
  if (!def) {
    throw new Error(
      `Form "${formId}" is not registered. Applications must registerForm().`
    );
  }
  return def;
}

export function listFormsForEntityType(entityType: string): FormDefinition[] {
  return listFormDefinitions({ entityType });
}

export const FormRegistry = {
  register: registerForm,
  unregister: unregisterForm,
  get: getFormDefinition,
  list: listFormDefinitions,
  listForEntityType: listFormsForEntityType,
  assert: assertFormRegistered,
  resetForTests: resetFormRegistryForTests,
} as const;
