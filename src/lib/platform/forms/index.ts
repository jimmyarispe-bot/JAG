export { FormService, resetFormFrameworkForTests } from "@/lib/platform/forms/service";
export type { FormServiceApi } from "@/lib/platform/forms/service";

export {
  FormRegistry,
  registerForm,
  unregisterForm,
  getFormDefinition,
  listFormDefinitions,
  listFormsForEntityType,
  assertFormRegistered,
  resetFormRegistryForTests,
} from "@/lib/platform/forms/registry";

export { renderForm } from "@/lib/platform/forms/renderer";
export { validateFormSchema } from "@/lib/platform/forms/schema";
export { applyFormDefaults } from "@/lib/platform/forms/defaults";
export { resolveVisibleSections } from "@/lib/platform/forms/sections";
export {
  FORM_FIELD_TYPES,
  FORM_FIELD_TYPE_LABELS,
  isFormFieldType,
} from "@/lib/platform/forms/fields";
export {
  evaluateFormConditions,
  evaluateFormCondition,
  getValueAtPath,
} from "@/lib/platform/forms/visibility";
export {
  validateFormValues,
  runUniquenessHooks,
  registerCustomValidator,
  registerUniquenessHook,
  resetFormValidationHooksForTests,
} from "@/lib/platform/forms/validation";
export {
  canPerformFormAction,
  assertFormActionAllowed,
  resolveFormPermission,
} from "@/lib/platform/forms/permissions";
export { submitForm } from "@/lib/platform/forms/workflow";
export { attachFormDocuments } from "@/lib/platform/forms/documents";

export type {
  CustomValidatorFn,
  FormCondition,
  FormConditionGroup,
  FormConditionOperator,
  FormDefinition,
  FormFieldDefinition,
  FormFieldOption,
  FormFieldType,
  FormFieldValidation,
  FormPermissionRule,
  FormRenderModel,
  FormSectionDefinition,
  FormSubmitContext,
  FormSubmitResult,
  FormValidationIssue,
  FormValidationResult,
  FormValues,
  FormWorkflowBinding,
  RenderedField,
  RenderedSection,
  UniquenessHookFn,
} from "@/lib/platform/forms/types";
