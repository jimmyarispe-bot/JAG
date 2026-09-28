/**
 * Square API client — the real one.
 *
 * Replaces nothing yet. `InMemorySquarePort` in lib/platform/finance/payments
 * returns `{ id: "sq-<timestamp>", status: "completed" }` without contacting
 * Square, ignores the amount, and is the default port. It has no callers, so it
 * has never falsely settled an invoice.
 *
 * MONEY IS IN INTEGER CENTS. Square takes minor units, and float dollars are
 * how rounding errors become real money.
 */

import {
  SQUARE_API_VERSION,
  SQUARE_HOSTS,
  squareConfig,
  type SquareEnvironmentName,
} from "@/lib/connectors/square/config";

export type SquareLocation = {
  id: string;
  name: string;
  status: string;
  currency: string | null;
  country: string | null;
};

type SquareError = { category?: string; code?: string; detail?: string };

function describe(errors: SquareError[] | undefined, status: number): string {
  if (!errors?.length) return `Square returned HTTP ${status}.`;
  return errors
    .map((e) => [e.code, e.detail].filter(Boolean).join(": "))
    .join("; ")
    .slice(0, 400);
}

type Attempt =
  | { ok: true; environment: SquareEnvironmentName; data: unknown }
  | { ok: false; environment: SquareEnvironmentName; status: number; error: string };

async function callOnce(
  environment: SquareEnvironmentName,
  path: string,
  accessToken: string,
  init?: { readonly method?: "GET" | "POST"; readonly body?: unknown }
): Promise<Attempt> {
  try {
    const method = init?.method ?? "GET";
    const response = await fetch(`${SQUARE_HOSTS[environment]}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Square-Version": SQUARE_API_VERSION,
        Accept: "application/json",
        ...(init?.body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: init?.body === undefined ? undefined : JSON.stringify(init.body),
    });
    const text = await response.text();
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      return {
        ok: false,
        environment,
        status: response.status,
        error: `Non-JSON response (HTTP ${response.status}).`,
      };
    }
    if (!response.ok) {
      return {
        ok: false,
        environment,
        status: response.status,
        error: describe((json as { errors?: SquareError[] }).errors, response.status),
      };
    }
    return { ok: true, environment, data: json };
  } catch (err) {
    return {
      ok: false,
      environment,
      status: 0,
      error: err instanceof Error ? err.message : "Square request failed",
    };
  }
}

/**
 * Call Square, discovering the environment when it is not pinned.
 *
 * A token belongs to exactly one environment and Square will say so. Trying
 * production and falling back to sandbox costs one extra request, once, and
 * removes an entire category of misconfiguration -- one that cost an evening
 * because a variable that was demonstrably set kept arriving empty.
 */
async function squareCall(
  path: string,
  init?: { readonly method?: "GET" | "POST"; readonly body?: unknown }
): Promise<
  | { ok: true; environment: SquareEnvironmentName; data: unknown }
  | { ok: false; error: string; tried: SquareEnvironmentName[] }
> {
  const cfg = squareConfig();
  if (!cfg.accessToken) {
    return {
      ok: false,
      error: "SQUARE_ACCESS_TOKEN is not set on this deployment.",
      tried: [],
    };
  }

  const order: SquareEnvironmentName[] = cfg.pinnedEnvironment
    ? [cfg.pinnedEnvironment]
    : ["production", "sandbox"];

  const failures: string[] = [];
  for (const environment of order) {
    const attempt = await callOnce(environment, path, cfg.accessToken, init);
    if (attempt.ok) return { ok: true, environment, data: attempt.data };
    failures.push(`${environment}: ${attempt.error}`);
    // Only a 401 means "wrong environment for this token". Anything else is a
    // real failure and trying the other host would just obscure it.
    if (attempt.status !== 401) break;
  }

  return {
    ok: false,
    error: failures.join(" | "),
    tried: order,
  };
}


/**
 * GET, unchanged - the name every existing caller uses.
 */
async function squareGet(path: string) {
  return squareCall(path);
}

/**
 * POST, added 28 September 2026 so the JAG can create a Square payment link.
 *
 * Until now this client could only read. Nothing in the system has ever taken
 * a payment: InMemorySquarePort returns {status:"completed"} without
 * contacting anybody, and its own comment notes that having no callers is the
 * only reason it has never falsely settled an invoice.
 *
 * The environment discovery above is shared deliberately. A POST that guessed
 * the wrong host would create a payment link in the sandbox and hand it to a
 * family, who would pay nothing and believe they had paid.
 */
export async function squarePost(path: string, body: unknown) {
  return squareCall(path, { method: "POST", body });
}

export async function listSquareLocations(): Promise<
  | { ok: true; environment: SquareEnvironmentName; locations: SquareLocation[] }
  | { ok: false; error: string; tried: SquareEnvironmentName[] }
> {
  const result = await squareGet("/v2/locations");
  if (!result.ok) return result;

  const data = result.data as {
    locations?: {
      id: string;
      name?: string;
      status?: string;
      currency?: string;
      country?: string;
    }[];
  };

  return {
    ok: true,
    environment: result.environment,
    locations: (data.locations ?? []).map((l) => ({
      id: l.id,
      name: l.name ?? "(unnamed)",
      status: l.status ?? "UNKNOWN",
      currency: l.currency ?? null,
      country: l.country ?? null,
    })),
  };
}
