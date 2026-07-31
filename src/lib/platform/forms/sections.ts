import { applyFormDefaults } from "@/lib/platform/forms/defaults";
import { evaluateFormConditions } from "@/lib/platform/forms/visibility";
import type {
  FormDefinition,
  FormValues,
  RenderedSection,
} from "@/lib/platform/forms/types";

export function resolveVisibleSections(
  definition: FormDefinition,
  rawValues: FormValues = {}
): RenderedSection[] {
  const values = applyFormDefaults(definition, rawValues);
  const byKey = Object.fromEntries(definition.fields.map((f) => [f.key, f]));

  return definition.sections.map((section) => {
    const sectionVisible = evaluateFormConditions(section.visibleWhen, values);
    const fields = section.fields
      .map((key) => byKey[key])
      .filter(Boolean)
      .map((field) => {
        const fieldVisible =
          sectionVisible &&
          evaluateFormConditions(field!.visibleWhen, values);
        return {
          ...field!,
          visible: fieldVisible,
          value: values[field!.key],
          options: field!.options?.map((o) => ({ ...o })),
          validation: field!.validation ? { ...field!.validation } : undefined,
          metadata: { ...(field!.metadata ?? {}) },
        };
      });

    return {
      key: section.key,
      title: section.title,
      description: section.description ?? null,
      visible: sectionVisible,
      fields,
    };
  });
}
