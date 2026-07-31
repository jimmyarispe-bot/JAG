import { applyFormDefaults } from "@/lib/platform/forms/defaults";
import { evaluateFormConditions } from "@/lib/platform/forms/visibility";
import type {
  CustomValidatorFn,
  FormDefinition,
  FormFieldDefinition,
  FormValidationIssue,
  FormValidationResult,
  FormValues,
  UniquenessHookFn,
} from "@/lib/platform/forms/types";

const customValidators = new Map<string, CustomValidatorFn>();
const uniquenessHooks = new Map<string, UniquenessHookFn>();

export function resetFormValidationHooksForTests(): void {
  customValidators.clear();
  uniquenessHooks.clear();
}

/** Applications register named validators/hooks; platform invokes by id. */
export function registerCustomValidator(
  id: string,
  fn: CustomValidatorFn
): void {
  customValidators.set(id, fn);
}

export function registerUniquenessHook(id: string, fn: UniquenessHookFn): void {
  uniquenessHooks.set(id, fn);
}

function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

function validateField(
  field: FormFieldDefinition,
  value: unknown,
  values: FormValues
): FormValidationIssue[] {
  const issues: FormValidationIssue[] = [];
  const rules = field.validation;
  if (!rules) return issues;

  if (rules.required && isEmpty(value)) {
    issues.push({
      path: field.key,
      code: "required",
      message: rules.message ?? `${field.label} is required`,
    });
    return issues;
  }

  if (isEmpty(value)) return issues;

  if (rules.regex && typeof value === "string") {
    const re = new RegExp(rules.regex);
    if (!re.test(value)) {
      issues.push({
        path: field.key,
        code: "regex",
        message: rules.message ?? `${field.label} format is invalid`,
      });
    }
  }

  if (typeof value === "number" || (typeof value === "string" && value !== "" && !Number.isNaN(Number(value)))) {
    const num = typeof value === "number" ? value : Number(value);
    if (rules.min != null && num < rules.min) {
      issues.push({
        path: field.key,
        code: "range_min",
        message: rules.message ?? `${field.label} must be ≥ ${rules.min}`,
      });
    }
    if (rules.max != null && num > rules.max) {
      issues.push({
        path: field.key,
        code: "range_max",
        message: rules.message ?? `${field.label} must be ≤ ${rules.max}`,
      });
    }
  }

  if (typeof value === "string") {
    if (rules.minLength != null && value.length < rules.minLength) {
      issues.push({
        path: field.key,
        code: "min_length",
        message:
          rules.message ??
          `${field.label} must be at least ${rules.minLength} characters`,
      });
    }
    if (rules.maxLength != null && value.length > rules.maxLength) {
      issues.push({
        path: field.key,
        code: "max_length",
        message:
          rules.message ??
          `${field.label} must be at most ${rules.maxLength} characters`,
      });
    }
  }

  if (field.type === "email" && typeof value === "string") {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      issues.push({
        path: field.key,
        code: "email",
        message: rules.message ?? `${field.label} must be a valid email`,
      });
    }
  }

  if (rules.customValidator) {
    const fn = customValidators.get(rules.customValidator);
    if (!fn) {
      issues.push({
        path: field.key,
        code: "custom_missing",
        message: `Custom validator "${rules.customValidator}" is not registered`,
      });
    } else {
      const issue = fn(value, values, field);
      if (issue) issues.push(issue);
    }
  }

  return issues;
}

/**
 * Platform validation over visible fields only (hidden fields are skipped).
 */
export function validateFormValues(
  definition: FormDefinition,
  rawValues: FormValues
): FormValidationResult {
  const values = applyFormDefaults(definition, rawValues);
  const issues: FormValidationIssue[] = [];

  for (const field of definition.fields) {
    if (!evaluateFormConditions(field.visibleWhen, values)) continue;
    issues.push(...validateField(field, values[field.key], values));
  }

  return { valid: issues.length === 0, issues };
}

/** Async uniqueness hooks — call after sync validation when needed. */
export async function runUniquenessHooks(
  definition: FormDefinition,
  rawValues: FormValues
): Promise<FormValidationIssue[]> {
  const values = applyFormDefaults(definition, rawValues);
  const issues: FormValidationIssue[] = [];

  for (const field of definition.fields) {
    if (!evaluateFormConditions(field.visibleWhen, values)) continue;
    const hookId = field.validation?.uniquenessHook;
    if (!hookId) continue;
    const fn = uniquenessHooks.get(hookId);
    if (!fn) {
      issues.push({
        path: field.key,
        code: "uniqueness_missing",
        message: `Uniqueness hook "${hookId}" is not registered`,
      });
      continue;
    }
    const unique = await fn(values[field.key], values, field);
    if (!unique) {
      issues.push({
        path: field.key,
        code: "uniqueness",
        message:
          field.validation?.message ?? `${field.label} must be unique`,
      });
    }
  }

  return issues;
}
