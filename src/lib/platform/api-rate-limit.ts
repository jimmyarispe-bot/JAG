import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

type LimitResult = { ok: true } | { ok: false; retryAfter: number };

/** In-memory fallback (single instance). Prefer durable RPC / Upstash when configured. */
export function checkRateLimitMemory(
  key: string,
  limit = 30,
  windowMs = 60_000
): LimitResult {
  const now = Date.now();
  const entry = memoryBuckets.get(key);
  if (!entry || entry.resetAt < now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (entry.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count += 1;
  return { ok: true };
}

/** @deprecated Prefer checkRateLimitAsync — kept for sync call sites */
export function checkRateLimit(key: string, limit = 30, windowMs = 60_000): LimitResult {
  return checkRateLimitMemory(key, limit, windowMs);
}

async function checkRateLimitUpstash(
  key: string,
  limit: number,
  windowMs: number
): Promise<LimitResult | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const windowSec = Math.max(1, Math.ceil(windowMs / 1000));
  const redisKey = `rl:${key}`;
  try {
    const incr = await fetch(`${url}/incr/${encodeURIComponent(redisKey)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!incr.ok) return null;
    const body = (await incr.json()) as { result?: number };
    const count = Number(body.result ?? 0);
    if (count === 1) {
      await fetch(`${url}/expire/${encodeURIComponent(redisKey)}/${windowSec}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
    }
    if (count > limit) {
      return { ok: false, retryAfter: windowSec };
    }
    return { ok: true };
  } catch {
    return null;
  }
}

async function checkRateLimitRpc(
  key: string,
  limit: number,
  windowMs: number
): Promise<LimitResult | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  try {
    const client = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await client.rpc("check_rate_limit_bucket", {
      p_key: key,
      p_limit: limit,
      p_window_seconds: Math.max(1, Math.ceil(windowMs / 1000)),
    });
    if (error) return null;
    if (data === true) return { ok: true };
    if (data === false) {
      return { ok: false, retryAfter: Math.max(1, Math.ceil(windowMs / 1000)) };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Durable-first rate limit: Upstash → Supabase RPC → memory.
 */
export async function checkRateLimitAsync(
  key: string,
  limit = 30,
  windowMs = 60_000
): Promise<LimitResult> {
  const upstash = await checkRateLimitUpstash(key, limit, windowMs);
  if (upstash) return upstash;
  const rpc = await checkRateLimitRpc(key, limit, windowMs);
  if (rpc) return rpc;
  return checkRateLimitMemory(key, limit, windowMs);
}

export function rateLimitResponse(retryAfter: number) {
  return NextResponse.json(
    { error: "Too many requests", retryAfter },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}

export function getClientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export function getClientIpFromHeaders(headerStore: Headers): string {
  return headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
