import { ENV_VAR_DEFINITIONS } from "@/lib/platform/env/schema";
import type {
  AppEnvironment,
  EnvValidationIssue,
  EnvValidationResult,
  EnvVarDefinition,
  ValidateEnvironmentOptions,
} from "@/lib/platform/env/types";

export class EnvValidationError extends Error {
  readonly environment: AppEnvironment;
  readonly issues: EnvValidationIssue[];

  constructor(environment: AppEnvironment, issues: EnvValidationIssue[]) {
    super(formatEnvValidationError(environment, issues));
    this.name = "EnvValidationError";
    this.environment = environment;
    this.issues = issues;
  }
}

/** Resolve deployment environment without logging any secret values. */
export function resolveAppEnvironment(env: NodeJS.ProcessEnv = process.env): AppEnvironment {
  const vercelEnv = (env.VERCEL_ENV ?? "").trim().toLowerCase();
  if (vercelEnv === "production" || vercelEnv === "preview" || vercelEnv === "development") {
    return vercelEnv;
  }

  const nodeEnv = (env.NODE_ENV ?? "").trim().toLowerCase();
  if (nodeEnv === "production") return "production";
  if (nodeEnv === "test") return "development";
  return "development";
}

function isPresent(value: string | undefined): value is string {
  return value !== undefined;
}

function isNonEmpty(value: string): boolean {
  return value.trim().length > 0;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function validateDefinition(
  definition: EnvVarDefinition,
  environment: AppEnvironment,
  env: NodeJS.ProcessEnv
): EnvValidationIssue | null {
  const raw = env[definition.name];
  const required = definition.requiredIn.includes(environment);

  if (!isPresent(raw)) {
    if (required) {
      return {
        name: definition.name,
        code: "missing",
        message: `Missing required environment variable ${definition.name} (${definition.description}) for ${environment}.`,
        secret: Boolean(definition.secret),
      };
    }
    return null;
  }

  if (!isNonEmpty(raw)) {
    return {
      name: definition.name,
      code: "empty",
      message: `Environment variable ${definition.name} is set but empty (${definition.description}).`,
      secret: Boolean(definition.secret),
    };
  }

  if (definition.format === "url" && !isValidHttpUrl(raw)) {
    return {
      name: definition.name,
      code: "malformed_url",
      message: `Environment variable ${definition.name} must be a valid http(s) URL (${definition.description}).`,
      secret: Boolean(definition.secret),
    };
  }

  return null;
}

export function formatEnvValidationError(
  environment: AppEnvironment,
  issues: EnvValidationIssue[]
): string {
  const lines = [
    `Environment validation failed for ${environment} (${issues.length} issue${issues.length === 1 ? "" : "s"}).`,
    "Secret values are never logged.",
    ...issues.map((issue) => `- [${issue.code}] ${issue.message}`),
  ];
  return lines.join("\n");
}

/**
 * Validate environment variables for the current (or provided) app environment.
 * Never includes secret values in issues or thrown errors.
 */
export function validateEnvironment(
  options: ValidateEnvironmentOptions = {}
): EnvValidationResult {
  const env = options.env ?? process.env;
  const environment = options.appEnvironment ?? resolveAppEnvironment(env);
  const throwOnError = options.throwOnError ?? true;

  const issues: EnvValidationIssue[] = [];
  for (const definition of ENV_VAR_DEFINITIONS) {
    const issue = validateDefinition(definition, environment, env);
    if (issue) issues.push(issue);
  }

  const result: EnvValidationResult = {
    ok: issues.length === 0,
    environment,
    issues,
  };

  if (!result.ok && throwOnError) {
    throw new EnvValidationError(environment, issues);
  }

  return result;
}

/** Idempotent startup entrypoint for Next.js instrumentation. */
let validated = false;

export function ensureEnvironmentValidated(
  options: ValidateEnvironmentOptions = {}
): EnvValidationResult {
  if (validated && options.env === undefined && options.appEnvironment === undefined) {
    return { ok: true, environment: resolveAppEnvironment(), issues: [] };
  }

  const result = validateEnvironment(options);
  if (result.ok) validated = true;
  return result;
}

/** Test helper — resets the startup memoization flag. */
export function resetEnvironmentValidationState(): void {
  validated = false;
}
