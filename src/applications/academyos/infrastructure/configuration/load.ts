import type {
  InfrastructureConfiguration,
  InfrastructureEmailDriver,
  InfrastructurePersistenceDriver,
} from "@/applications/academyos/infrastructure/configuration/types";

function hasSupabaseCredentials(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function persistenceFromEnv(
  fallback: InfrastructurePersistenceDriver
): InfrastructurePersistenceDriver {
  const raw = process.env.ACADEMYOS_PERSISTENCE?.toLowerCase();
  if (raw === "null" || raw === "memory" || raw === "supabase") return raw;
  if (hasSupabaseCredentials()) return "supabase";
  return fallback;
}

function emailFromEnv(
  fallback: InfrastructureEmailDriver
): InfrastructureEmailDriver {
  const raw = process.env.ACADEMYOS_EMAIL?.toLowerCase();
  if (raw === "memory" || raw === "resend" || raw === "none") return raw;
  if (process.env.RESEND_API_KEY) return "resend";
  return fallback;
}

/**
 * Production default: memory-backed production repositories (or supabase when configured).
 * Explicit ACADEMYOS_PERSISTENCE=null keeps Null* bindings for dry-run tests.
 */
export function loadInfrastructureConfiguration(
  overrides?: Partial<InfrastructureConfiguration>
): InfrastructureConfiguration {
  const nodeEnv = process.env.NODE_ENV;
  const isTest = nodeEnv === "test";
  const defaults: InfrastructureConfiguration = {
    persistenceDriver: isTest
      ? persistenceFromEnv("memory")
      : persistenceFromEnv("memory"),
    emailDriver: isTest ? "memory" : emailFromEnv("none"),
    storageDriver:
      !isTest && hasSupabaseCredentials() ? "supabase" : "memory",
    searchDriver: isTest ? "memory" : "stub",
    cacheDriver: "memory",
    queueDriver: "memory",
    identityDriver: isTest ? "static" : "jag",
  };
  return { ...defaults, ...overrides };
}
