/**
 * Server-side JAG platform session helpers (Next.js cookies).
 */

import { cookies } from "next/headers";
import {
  JAG_PLATFORM_SESSION_COOKIE,
  decodeJagPlatformSession,
  type JagPlatformSession,
} from "@/lib/jag-platform/session";

export async function getJagPlatformSession(): Promise<JagPlatformSession | null> {
  const jar = await cookies();
  return decodeJagPlatformSession(
    jar.get(JAG_PLATFORM_SESSION_COOKIE)?.value
  );
}
