export { ENV_VAR_DEFINITIONS, getEnvVarDefinition } from "@/lib/platform/env/schema";
export type {
  AppEnvironment,
  EnvIssueCode,
  EnvValidationIssue,
  EnvValidationResult,
  EnvVarDefinition,
  EnvVarFormat,
  ValidateEnvironmentOptions,
} from "@/lib/platform/env/types";
export {
  EnvValidationError,
  ensureEnvironmentValidated,
  formatEnvValidationError,
  resetEnvironmentValidationState,
  resolveAppEnvironment,
  validateEnvironment,
} from "@/lib/platform/env/validate";
