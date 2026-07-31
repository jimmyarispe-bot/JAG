export type AcademyEnvironmentName = "development" | "test" | "production";

export type AcademyPersistenceDriver = "null" | "memory" | "supabase";

export type AcademyEnvironment = {
  name: AcademyEnvironmentName;
  /** When true, composition may bind ephemeral/null infrastructure. */
  allowNullRepositories: boolean;
  /** When true, adapters may no-op side effects in tests. */
  dryRunAdapters: boolean;
  /**
   * Persistence driver hint (mirrored into infrastructure configuration).
   * Prefer ACADEMYOS_PERSISTENCE env or infrastructure overrides.
   */
  persistenceDriver: AcademyPersistenceDriver;
};

function detectEnvironmentName(): AcademyEnvironmentName {
  const raw =
    process.env.ACADEMYOS_ENV ??
    process.env.NODE_ENV ??
    "development";
  if (raw === "test" || raw === "production" || raw === "development") {
    return raw;
  }
  return "development";
}

/** Central environment options — no scattered env reads in services. */
export function loadAcademyEnvironment(
  overrides?: Partial<AcademyEnvironment>
): AcademyEnvironment {
  const name = overrides?.name ?? detectEnvironmentName();
  const persistenceRaw = process.env.ACADEMYOS_PERSISTENCE?.toLowerCase();
  const persistenceDriver: AcademyPersistenceDriver =
    persistenceRaw === "null" ||
    persistenceRaw === "memory" ||
    persistenceRaw === "supabase"
      ? persistenceRaw
      : "memory";

  const defaults: AcademyEnvironment = {
    name,
    allowNullRepositories: name !== "production",
    dryRunAdapters: name === "test",
    persistenceDriver,
  };
  return { ...defaults, ...overrides, name: overrides?.name ?? name };
}
