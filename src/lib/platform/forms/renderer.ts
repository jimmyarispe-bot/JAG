import { applyFormDefaults } from "@/lib/platform/forms/defaults";
import { assertFormRegistered } from "@/lib/platform/forms/registry";
import { resolveVisibleSections } from "@/lib/platform/forms/sections";
import type { FormRenderModel, FormValues } from "@/lib/platform/forms/types";

/**
 * Build a declarative FormRenderModel from a registered schema + values.
 * This is the platform "render" step — not a React UI redesign.
 */
export function renderForm(
  formId: string,
  rawValues: FormValues = {}
): FormRenderModel {
  const definition = assertFormRegistered(formId);
  const values = applyFormDefaults(definition, rawValues);
  const sections = resolveVisibleSections(definition, values);

  const visibleValues: FormValues = {};
  for (const section of sections) {
    if (!section.visible) continue;
    for (const field of section.fields) {
      if (!field.visible) continue;
      visibleValues[field.key] = field.value;
    }
  }

  return {
    formId: definition.id,
    version: definition.version,
    title: definition.title,
    description: definition.description ?? null,
    entityType: definition.entityType,
    sections,
    values: visibleValues,
  };
}
