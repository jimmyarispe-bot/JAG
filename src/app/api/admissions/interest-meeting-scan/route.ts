import { NextRequest, NextResponse } from "next/server";

import { runInterestMeetingScan } from "@/lib/admissions/chase/run";
import { guardApiRoute } from "@/lib/platform/identity/api-guard";
import { authorizeBearerSecret } from "@/lib/security/timing-safe";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { createAuthClient } from "@/lib/supabase/server-auth";

/**
 * The 11pm interest-meeting scan.
 *
 * A ROUTE OF ITS OWN, not a job inside processAllPlatformQueues. That runner
 * executes thirty-odd jobs in one invocation against a 60-second ceiling, and
 * googleWorkspace.sync alone reports 605 seconds and has never completed. A
 * job that reads three Google calendars and writes a handful of rows has no
 * business sharing a timeout with it.
 *
 * THE SERVICE ROLE ON THE CRON PATH, AND ONLY THERE.
 *
 * This is the lesson written across the top of process-queues.ts, and it is
 * worth repeating because it cost months. A cron request carries no cookies.
 * A cookie-bound Supabase client therefore has no user, every policy of the
 * form `using (can_access_school(...))` is false, every select returns zero
 * rows, and the route answers {success: true} having done nothing at all.
 * Zero rows with no error is a policy refusal wearing a success costume.
 *
 * So: a machine caller gets the service role. A human who presses the button
 * runs as themselves, under their own permissions, and sees what their own
 * account can see.
 *
 * GET IS READ-ONLY AND ALWAYS A DRY RUN for a human. Opening a URL in a
 * browser should never send mail to a family. A real run is a POST, or the
 * cron.
 */

export const maxDuration = 60;

async function humanGate(): Promise<NextResponse | null> {
  const supabase = await createAuthClient();
  /*
   * There is no "admissions.admin". The first draft had one and the typecheck
   * refused it against PermissionKey, which is the gate doing exactly its job:
   * a permission that does not exist would have silently granted nobody, and a
   * route nobody can open looks identical to a route that is working.
   */
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

  const params = request.nextUrl.searchParams;
  const force = params.get("force") === "1";
  const dryRun = params.get("dryRun") === "1";

  if (isCron) {
    const report = await runInterestMeetingScan(createServiceRoleClient(), {
      force,
      dryRun,
    });

    /*
     * A campus nobody can see is shouted about in the log as well as the
     * response, because nobody reads the response of an 11pm cron. The probe
     * found Danni's calendar unshared on 2 October, which made The Academy FL
     * invisible to this job - every FL family would have been chased three
     * times and telephoned however promptly they booked.
     */
    if (report.campusesWithNoCalendar.length) {
      console.error(
        "[interest-meeting-scan] NO CALENDAR SHARED FOR:",
        report.campusesWithNoCalendar.join("; ")
      );
    }
    if (report.errors.length) {
      console.error("[interest-meeting-scan] errors", report.errors);
    }
    console.log(
      `[interest-meeting-scan] ${report.ran ? "ran" : "skipped"}`,
      report.why ?? "",
      `bookings ${report.bookingsMatched}/${report.bookingsSeen}`,
      `letters ${report.letters.length}`
    );

    return NextResponse.json(report);
  }

  const refused = await humanGate();
  if (refused) return refused;

  const supabase = await createAuthClient();
  return NextResponse.json(
    await runInterestMeetingScan(supabase, { force, dryRun })
  );
}

/**
 * Vercel's scheduler sends a GET, so the cron path has to live here too.
 *
 * The order is the whole point: the bearer token is checked FIRST. Were the
 * human branch first, the nightly run would be refused by the permission gate
 * - a cron has no session - and the job would never once execute. Written out
 * because it is the kind of ordering that looks arbitrary and is not.
 *
 * A HUMAN OPENING THIS URL GETS A DRY RUN AND NOTHING ELSE. Pasting a link
 * into a browser must never post mail to a family. A real manual run is a
 * POST, from the button.
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
    await runInterestMeetingScan(supabase, {
      force: request.nextUrl.searchParams.get("force") === "1",
      dryRun: true,
    })
  );
}
