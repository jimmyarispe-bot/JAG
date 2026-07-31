import { FormService } from "@/lib/platform/forms";

/**
 * Isolates AcademyOS from Forms Framework implementation details.
 */
export const FormsPlatformAdapter = {
  getDefinition(formId: string) {
    return FormService.get(formId);
  },

  listForEntity(entityType: string) {
    return FormService.listForEntityType(entityType);
  },

  validate(formId: string, values: Record<string, unknown>) {
    const definition = FormService.get(formId);
    if (!definition) {
      return {
        valid: false as const,
        issues: [
          {
            code: "missing_form",
            message: `Form ${formId} not registered`,
            path: "formId",
          },
        ],
      };
    }
    return FormService.validate(definition, values);
  },

  applyDefaults(formId: string, values: Record<string, unknown> = {}) {
    const definition = FormService.get(formId);
    if (!definition) return values;
    return FormService.applyDefaults(definition, values);
  },
};
