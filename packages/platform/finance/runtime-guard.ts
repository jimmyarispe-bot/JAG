/**
 * Runtime guard for the ephemeral JAG Finance stores.
 *
 * Every store under `packages/platform/finance/` is a `globalThis` Map. It is a
 * single-process foundation for tests and local development — it is NOT backed
 * by a database. On serverless (Vercel), data written to it is lost when the
 * lambda is recycled and is never shared between concurrent instances.
 *
 * Without this guard the failure is silent: routes return 200, writes appear to
 * succeed, and the data is simply gone on the next request. That is the worst
 * possible behaviour for a finance system, so any deployed environment fails
 * loudly here instead.
 *
 * To make one of these modules real, port its store to Supabase and give its
 * write paths an explicit transaction boundary — see `README.md` in this
 * package.
 */

const OVERRIDE_ENV = "JAG_ALLOW_EPHEMERAL_FINANCE" as const;

/** True for local development and automated tests, false for any deployment. */
function isEphemeralStoreAllowed(): boolean {
  if (process.env[OVERRIDE_ENV] === "1") return true;

  // Vercel sets VERCEL_ENV to production | preview | development.
  const vercelEnv = process.env.VERCEL_ENV?.trim().toLowerCase();
  if (vercelEnv === "production" || vercelEnv === "preview") return false;

  const nodeEnv = process.env.NODE_ENV?.trim().toLowerCase();
  return nodeEnv === "test" || nodeEnv === "development" || !nodeEnv;
}

/**
 * Throw when an ephemeral finance store is touched in a deployed environment.
 * Called from every `store()` accessor in this package.
 *
 * @param storeName store being accessed, for the error message
 */
export function assertEphemeralStoreAllowed(storeName: string): void {
  if (isEphemeralStoreAllowed()) return;

  throw new Error(
    `[jag-finance] The "${storeName}" store is in-memory only and is not safe in a deployed ` +
      `environment — writes are lost when the instance recycles and are not shared between ` +
      `instances. This module has not been ported to Supabase yet. ` +
      `See packages/platform/finance/README.md. ` +
      `Set ${OVERRIDE_ENV}=1 only for a throwaway demo where data loss is acceptable.`
  );
}

/** @internal exported for tests of the guard itself. */
export const EPHEMERAL_FINANCE_OVERRIDE_ENV = OVERRIDE_ENV;
