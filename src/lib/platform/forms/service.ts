import { attachFormDocuments } from "@/lib/platform/forms/documents";
import { applyFormDefaults } from "@/lib/platform/forms/defaults";
import {
  FORM_FIELD_TYPE_LABELS,
  FORM_FIELD_TYPES,
  isFormFieldType,
} from "@/lib/platform/forms/fields";
import {
  assertFormActionAllowed,
  canPerformFormAction,
  resolveFormPermission,
} from "@/lib/platform/forms/permissions";
import {
  FormRegistry,
  assertFormRegistered,
  getFormDefinition,
  listFormDefinitions,
  listFormsForEntityType,
  registerForm,
  resetFormRegistryForTests,
  unregisterForm,
} from "@/lib/platform/forms/registry";
import { renderForm } from "@/lib/platform/forms/renderer";
import { validateFormSchema } from "@/lib/platform/forms/schema";
import { resolveVisibleSections } from "@/lib/platform/forms/sections";
import {
  registerCustomValidator,
  registerUniquenessHook,
  resetFormValidationHooksForTests,
  runUniquenessHooks,
  validateFormValues,
} from "@/lib/platform/forms/validation";
import {
  evaluateFormCondition,
  evaluateFormConditions,
  getValueAtPath,
} from "@/lib/platform/forms/visibility";
import { submitForm } from "@/lib/platform/forms/workflow";

export function resetFormFrameworkForTests(): void {
  resetFormRegistryForTests();
  resetFormValidationHooksForTests();
}

/**
 * Universal Forms Framework service.
 * Applications register schemas; platform validates and builds render models.
 */
export const FormService = {
  registry: FormRegistry,
  register: registerForm,
  unregister: unregisterForm,
  get: getFormDefinition,
  list: listFormDefinitions,
  listForEntityType: listFormsForEntityType,
  assertRegistered: assertFormRegistered,

  fieldTypes: FORM_FIELD_TYPES,
  fieldTypeLabels: FORM_FIELD_TYPE_LABELS,
  isFieldType: isFormFieldType,

  validateSchema: validateFormSchema,
  applyDefaults: applyFormDefaults,
  validate: validateFormValues,
  runUniquenessHooks,
  registerCustomValidator,
  registerUniquenessHook,

  evaluateConditions: evaluateFormConditions,
  evaluateCondition: evaluateFormCondition,
  getValueAtPath,
  resolveSections: resolveVisibleSections,
  render: renderForm,

  canPerform: canPerformFormAction,
  assertAction: assertFormActionAllowed,
  resolvePermission: resolveFormPermission,

  submit: submitForm,
  attachDocuments: attachFormDocuments,

  resetForTests: resetFormFrameworkForTests,
} as const;

export type FormServiceApi = typeof FormService;
