/**
 * Documented architecture rules for the platform core fence (Sprint 078).
 * Enforced by tests/unit/architecture/platform-boundaries.test.ts
 */

export const PLATFORM_CORE_MODULES = [
  "sdk",
  "schema",
  "entities",
  "forms",
  "workflows/framework",
  "api",
  "graph",
  "decisions",
  "notifications",
  "automation/operating",
  "intelligence/forecasting",
  "readiness",
] as const;

/** Application / domain packages platform core must not import. */
export const FORBIDDEN_APP_IMPORT_PREFIXES = [
  "@/lib/admissions",
  "@/lib/students",
  "@/lib/ssis",
  "@/lib/hr",
  "@/lib/portal",
  "@/lib/finance/",
  "@/lib/finance-platform",
  "@/lib/certification",
  "@/lib/scheduling",
  "@/lib/work/",
  "@/lib/families",
  "@/lib/instruction",
  "@/lib/compliance",
  "@/lib/scholarship",
] as const;

/**
 * Allowed cross-framework imports inside the core fence.
 * Key = module folder under src/lib/platform/; values = allowed targets.
 */
export const ALLOWED_CORE_DEPENDENCIES: Record<string, readonly string[]> = {
  sdk: [],
  schema: ["entities", "forms", "workflows/framework"],
  entities: ["persistence"],
  forms: ["entities", "workflows/framework", "decisions"],
  "workflows/framework": [
    "decisions",
    "entities",
    "notifications",
    "automation/operating",
  ],
  api: ["schema"],
  graph: [
    "schema",
    "entities",
    "forms",
    "workflows/framework",
    "api",
  ],
  // decisions ↔ notifications is an existing documented coupling (assignment alerts)
  decisions: ["notifications", "persistence", "intelligence"],
  notifications: ["decisions", "persistence"],
  "automation/operating": ["decisions", "notifications", "persistence"],
  "intelligence/forecasting": ["founder", "persistence"],
  readiness: ["sdk"],
};

/** Modules that must never be imported by other core frameworks (consumer-only). */
export const CONSUMER_ONLY_MODULES = ["graph"] as const;

/** Application entry contract module — frameworks must not depend on it. */
export const APPLICATION_ENTRY_MODULE = "sdk";

export const ARCHITECTURE_RULES = [
  "Platform core modules may not depend on application packages.",
  "Runtime frameworks must not depend on each other except through documented contracts (ALLOWED_CORE_DEPENDENCIES).",
  "Knowledge Graph remains a consumer of metadata only — frameworks must not import graph.",
  "SDK remains the application entry contract — frameworks must not import sdk (except readiness).",
  "No application-specific field/type identifiers in platform core.",
] as const;
