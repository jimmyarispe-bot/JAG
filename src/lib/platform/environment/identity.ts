import { createAuthClient } from "@/lib/supabase/server-auth";

/**
 * Which deployment is this, and which database is it actually talking to?
 *
 * Written after 25 Aug 2026, when several hours went into answering exactly that.
 * The application looked identical on two deployments wired to two different
 * Supabase projects with near-identical names, and the environment variables
 * were stored as Secret so their values could not be read back from the
 * dashboard. Counts taken from one database were compared against writes made
 * to the other, and nothing reconciled.
 *
 * Two independent sources are read here and compared:
 *
 *   1. What the DEPLOYMENT believes  — Vercel's own environment variables.
 *   2. What the DATABASE says it is  — `platform_environment`, set by hand.
 *
 * Agreement is reassuring. Disagreement — a production deployment connected to a
 * staging database, say — is the failure worth shouting about, and no single
 * source could detect it.
 */

export type DeploymentEnvironment = "production" | "preview" | "development";

export interface EnvironmentIdentity {
  /** What Vercel says this deployment is. */
  readonly deployment: DeploymentEnvironment;
  /** Supabase project ref parsed from the connection URL, e.g. "ybcpaffklggaloxhnqkl". */
  readonly databaseRef: string | null;
  /** Name the database gives itself, e.g. "PRODUCTION". Null when unreachable. */
  readonly databaseName: string | null;
  /** Whether the database claims to be production. */
  readonly databaseIsProduction: boolean;
  /** Short git SHA of the running build, when available. */
  readonly commit: string | null;
  /**
   * True when the deployment and the database disagree about what this is.
   * A production deployment on a non-production database, or the reverse.
   */
  readonly mismatch: boolean;
  /** True when the database has not been named yet. */
  readonly unidentified: boolean;
}

/** Extract the project ref from `https://<ref>.supabase.co`. */
export function parseSupabaseRef(url: string | undefined): string | null {
  if (!url) return null;
  const match = url.match(/^https?:\/\/([a-z0-9]+)\.supabase\./i);
  return match?.[1] ?? null;
}

function resolveDeployment(): DeploymentEnvironment {
  const vercel = process.env.VERCEL_ENV;
  if (vercel === "production" || vercel === "preview" || vercel === "development") {
    return vercel;
  }
  return process.env.NODE_ENV === "production" ? "production" : "development";
}

export async function getEnvironmentIdentity(): Promise<EnvironmentIdentity> {
  const deployment = resolveDeployment();
  const databaseRef = parseSupabaseRef(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const commit = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null;

  let databaseName: string | null = null;
  let databaseIsProduction = false;

  try {
    const supabase = await createAuthClient();
    const { data } = await supabase
      .from("platform_environment")
      .select("environment_name, is_production")
      .limit(1)
      .maybeSingle();
    if (data) {
      databaseName = data.environment_name;
      databaseIsProduction = Boolean(data.is_production);
    }
  } catch {
    // An unreachable marker table is not worth breaking a page over. The banner
    // renders what it knows and says the database could not be identified,
    // which is itself the useful signal.
  }

  const unidentified = databaseName === null || databaseName === "UNIDENTIFIED";
  const mismatch = !unidentified && (deployment === "production") !== databaseIsProduction;

  return {
    deployment,
    databaseRef,
    databaseName,
    databaseIsProduction,
    commit,
    mismatch,
    unidentified,
  };
}

/**
 * Whether the banner should be shown at all.
 *
 * A correctly-configured production deployment stays clean — staff should not
 * see infrastructure chrome while doing their jobs. Everything else is marked.
 */
export function shouldShowBanner(identity: EnvironmentIdentity): boolean {
  if (identity.mismatch || identity.unidentified) return true;
  return identity.deployment !== "production";
}
