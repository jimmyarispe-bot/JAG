/** Runtime deployment environments with distinct env requirements. */
export type AppEnvironment = "development" | "preview" | "production";

export type EnvVarFormat = "string" | "url";

export interface EnvVarDefinition {
  name: string;
  /** Human-readable purpose (safe to log). */
  description: string;
  format?: EnvVarFormat;
  /** Never include the value in logs or error messages. */
  secret?: boolean;
  /** Environments where this variable is required (non-empty). */
  requiredIn: AppEnvironment[];
  /** Environments where the variable is optional but validated when present. */
  optionalIn?: AppEnvironment[];
}

export type EnvIssueCode = "missing" | "empty" | "malformed_url";

export interface EnvValidationIssue {
  name: string;
  code: EnvIssueCode;
  message: string;
  /** True when the variable holds a secret — value must never be logged. */
  secret: boolean;
}

export interface EnvValidationResult {
  ok: boolean;
  environment: AppEnvironment;
  issues: EnvValidationIssue[];
}

export interface ValidateEnvironmentOptions {
  /** Override process.env (tests). */
  env?: NodeJS.ProcessEnv;
  /** Override resolved app environment. */
  appEnvironment?: AppEnvironment;
  /** When true, throw EnvValidationError if validation fails. Default true. */
  throwOnError?: boolean;
}
