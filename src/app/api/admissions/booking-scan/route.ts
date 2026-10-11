import { NextRequest, NextResponse } from "next/server";

import { runInterestMeetingScan } from "@/lib/admissions/chase/run";
import { guardApiRoute } from "@/lib/platform/identity/api-guard";
import { authorizeBearerSecret } from "@/lib/security/timing-safe";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { createAuthClient } from "@/lib/supabase/server-auth";

/**
 * The hourly booking-discovery pass.
 *
 * SAME FUNCTION AS THE 11PM SCAN, in discoveryOnly mode: it reads the
 * calendars, records what families have booked, and queues the "RECORD your
 * notes" letter timed to each appointment. It writes no chase letters, makes
 * no judgement about anybody, and takes no night claim.
 *
 * ── WHY IT EXISTS ───────────────────────────────────────────────────────────
 *
 * The 11pm scan was the only thing that ever learned a booking existed -
 * Google tells us nothing, we read the calendars. Fine for a meeting booked a
 * day ahead; useless for one booked the same morning. A 9am booking for a 2pm
 * meeting produced a notes letter at 11pm that night, nine hours after the
 * meeting had ended, still reading "happening now".
 *
 * Jimmy, 5 October: same-day bookings happen, "usually not before 3 hours".
 * Hourly catches them with two hours to spare.
 *
 * ── WHY A SEPARATE ROUTE RATHER THAN A FLAG ON THE OLD ONE ──────────────────
 *
 * Vercel schedules by PATH. One path cannot be both hourly and nightly, and
 * the two runs want different arguments. Keeping them apart also means the
 * 11pm cron is untouched by anything done here.
 *
 * ── WHY NOT INSIDE processAllPlatformQueues ─────────────────────────────────
 *
 * Same reason as the 11pm scan, repeated because it cost months: that runner
 * executes thirty-odd jobs in one invocation against a 60-second ceiling, and
 * googleWorkspace.sync alone reports 605 seconds and has never completed.
 *
 * ── THE SERVICE ROLE ON THE CRON PATH, AND ONLY THERE ───────────────────────
 *
 * A cron request carries no cookies. A cookie-bound Supabase client therefore
 * has no user, every `using (can_access_school(...))` policy is false, every
 * select returns zero rows, and the route answers {success: true} having done
 * nothing. Zero rows with no error is a policy refusal wearing a success
 * costume.
 *
 * GET IS A DRY RUN FOR A HUMAN. Opening a URL in a browser must never queue
 * mail about a family.
 */

export const maxDuration = 60;

async function humanGate(): Promise<NextResponse | null> {
  const supabase = await createAuthClient();
  for (const permission of ["admissions.manage", "integration.manage"] as const) {
    const gate = await guardApiRoute(supabase, permission);
    if (!(gate instanceof NextResponse)) return null;
  }
  return NextResponse.json({ ok: false, message: "Not permitted." }, { status: 403 });
}

export async function POST(request: NextRequest) {
  const isCron = authorizeBearerSecret(
    request.headers.get("authorization"),
    process.env.CRON_SECRET
  );

  const dryRun = request.nextUrl.searchParams.get("dryRun") === "1";

  if (isCron) {
    const report = await runInterestMeetingScan(createServiceRoleClient(), {
      discoveryOnly: true,
      dryRun,
    });

    /*
     * A campus nobody can see is shouted about in the log as well as the
     * response, because nobody reads the response of a cron. The probe found
     * Danni's calendar unshared on 2 October, which made The Academy FL
     * invisible to this job entirely.
     */
    if (report.campusesWithNoCalendar.length) {
      console.error(
        "[booking-scan] NO CALENDAR SHARED FOR:",
        report.campusesWithNoCalendar.join("; ")
      );
    }
    if (report.errors.length) {
      console.error("[booking-scan] errors", report.errors);
    }

    /*
     * QUIET WHEN THERE IS NOTHING, because this runs twenty-four times a day
     * and a log line an hour about zero bookings is a log nobody reads. The
     * interesting runs are the ones that found something.
     */
    const found =
      report.bookingsRecorded.length +
      report.toursRecorded.length +
      report.bookingsNotNotified.length +
      /* A held confirmation is the most interesting thing a run can produce
         while HOLD_BOOKING_CONFIRMATIONS is on, and it must not be the one
         thing that lets a run count as quiet and print nothing. */
      report.confirmationsHeld.length;
    if (found || report.postCallSkipped.length) {
      console.log(
        "[booking-scan] recorded",
        JSON.stringify({
          bookings: report.bookingsRecorded,
          tours: report.toursRecorded,
          alreadyPast: report.bookingsNotNotified,
          confirmationsHeld: report.confirmationsHeld,
          notesLetterSkipped: report.postCallSkipped,
        })
      );
    }

    return NextResponse.json(report);
  }

  const refused = await humanGate();
  if (refused) return refused;

  const supabase = await createAuthClient();
  return NextResponse.json(
    await runInterestMeetingScan(supabase, { discoveryOnly: true, dryRun })
  );
}

/**
 * Vercel's scheduler sends a GET, so the cron path has to live here too, and
 * the bearer check comes FIRST. Were the human branch first, the hourly run
 * would be refused by the permission gate - a cron has no session - and the
 * job would never once execute.
 */
export async function GET(request: NextRequest) {
  const isCron = authorizeBearerSecret(
    request.headers.get("authorization"),
    process.env.CRON_SECRET
  );
  if (isCron) return POST(request);

  const refused = await humanGate();
  if (refused) return refused;

  const supabase = await createAuthClient();
  return NextResponse.json(
    await runInterestMeetingScan(supabase, { discoveryOnly: true, dryRun: true })
  );
}
