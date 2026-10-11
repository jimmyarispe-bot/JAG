import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { isPublicApiPath } from "@/lib/auth/must-reset-password";

/**
 * EVERY CRON IN vercel.json MUST BE ON THE EDGE ALLOWLIST.
 *
 * This test exists because the same fault shipped three times.
 *
 * middleware.ts matches "/api/:path*" and treats every API path as protected
 * unless isPublicApiPath names it. A Vercel cron sends
 * `Authorization: Bearer $CRON_SECRET` and NO session cookie, so middleware
 * answers 401 before the route can look at the header it was handed.
 *
 * Nothing fails when a path is forgotten. The cron registers, it fires on
 * time, Vercel shows it green, and it is refused at the edge in silence. On
 * 10 October the production log read, on one tick:
 *
 *   21:10:44  GET 200  /api/admissions/process-communications
 *   21:10:02  GET 401  /api/admissions/booking-scan
 *
 * Same scheduler, same secret, same second. One was on the list. The booking
 * scan had never run, and the nightly interest-meeting scan had never once
 * claimed a night - weeks of a platform reporting success at doing nothing.
 *
 * Adding a cron is two edits. This test is what says so out loud.
 */
describe("every cron in vercel.json reaches its route", () => {
  const vercelConfig = JSON.parse(
    readFileSync(join(process.cwd(), "vercel.json"), "utf8")
  ) as { crons?: { path: string; schedule: string }[] };

  const crons = vercelConfig.crons ?? [];

  it("declares at least one cron, so a wrong path cannot make this vacuous", () => {
    expect(crons.length).toBeGreaterThan(0);
  });

  it.each(crons.map((c) => c.path))(
    "%s is public at the edge, or middleware answers 401 before it runs",
    (path) => {
      expect(isPublicApiPath(path)).toBe(true);
    }
  );
});
