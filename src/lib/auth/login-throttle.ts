"use server";

import { headers } from "next/headers";
import {
  checkRateLimitAsync,
  getClientIpFromHeaders,
} from "@/lib/platform/api-rate-limit";

/** B.1 — Login throttling by IP + email (durable when RPC/Upstash available). */
export async function assertLoginNotThrottled(email: string): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const headerStore = await headers();
  const ip = getClientIpFromHeaders(headerStore);
  const normalized = email.trim().toLowerCase();
  const byIp = await checkRateLimitAsync(`login:ip:${ip}`, 20, 60_000);
  if (!byIp.ok) {
    return { ok: false, error: "Too many login attempts. Please wait and try again." };
  }
  if (normalized) {
    const byEmail = await checkRateLimitAsync(`login:email:${normalized}`, 10, 15 * 60_000);
    if (!byEmail.ok) {
      return { ok: false, error: "Too many login attempts for this account. Try again later." };
    }
  }
  return { ok: true };
}
