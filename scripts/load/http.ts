/**
 * RC-2 — timed HTTP client for load scenarios.
 */

export type HttpHit = {
  status: number;
  durationMs: number;
  ok: boolean;
  redirected: boolean;
  error?: string;
};

export type AuthHeaders = {
  cookie?: string;
  authorization?: string;
};

export async function timedFetch(
  url: string,
  options?: {
    method?: string;
    headers?: Record<string, string>;
    auth?: AuthHeaders;
    body?: string;
    timeoutMs?: number;
    redirect?: RequestRedirect;
  }
): Promise<HttpHit> {
  const started = performance.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options?.timeoutMs ?? 30_000);
  try {
    const headers: Record<string, string> = {
      Accept: "text/html,application/json,*/*",
      "User-Agent": "jag-rc2-load/1.0",
      ...(options?.headers ?? {}),
    };
    if (options?.auth?.cookie) headers.Cookie = options.auth.cookie;
    if (options?.auth?.authorization) headers.Authorization = options.auth.authorization;

    const res = await fetch(url, {
      method: options?.method ?? "GET",
      headers,
      body: options?.body,
      redirect: options?.redirect ?? "manual",
      signal: controller.signal,
    });
    // Drain body so connections can reuse.
    await res.arrayBuffer().catch(() => undefined);
    const durationMs = Math.round((performance.now() - started) * 100) / 100;
    const redirected = res.status >= 300 && res.status < 400;
    // 401/302 on protected routes without auth is an expected "gate" response — count as ok for infra load.
    const ok = res.status < 500;
    return { status: res.status, durationMs, ok, redirected };
  } catch (error) {
    const durationMs = Math.round((performance.now() - started) * 100) / 100;
    return {
      status: 0,
      durationMs,
      ok: false,
      redirected: false,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}
