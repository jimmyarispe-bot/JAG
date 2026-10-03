import { NextResponse } from "next/server";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { processCommunicationQueue } from "@/lib/admissions/communications/engine";
import { processWorkflowQueue } from "@/lib/admissions/automation/queue";
import { guardApiRoute } from "@/lib/platform/identity/api-guard";
import { authorizeBearerSecret } from "@/lib/security/timing-safe";

/**
 * Drain the admissions queues. Small, bounded, and safe to run often.
 *
 * TWO THINGS CHANGED HERE ON 3 OCTOBER, both to make it usable as a cron.
 *
 * 1. THE CRON PATH NOW GETS THE SERVICE ROLE.
 *
 *    It authorised the machine caller with CRON_SECRET and then did all of its
 *    work through a COOKIE-BOUND client. A cron request carries no cookies, so
 *    that client has no user; every policy of the form
 *    `using (can_access_school(...))` is false; every select returns zero rows;
 *    and the route answers {success: true} having sent nothing.
 *
 *    This is the identical fault that was found and fixed in
 *    process-queues.ts, written up at length across the top of that file, and
 *    left in place here because nothing had ever pointed a scheduler at this
 *    route. Wiring one to it without this fix would have produced a chase that
 *    queued letters perfectly every night and delivered none of them, and
 *    reported success while doing it. The house pattern, one more time: zero
 *    rows with no error is a policy refusal wearing a success costume.
 *
 * 2. VERCEL SENDS A GET, so there is a GET.
 *
 * A HUMAN STILL RUNS AS THEMSELVES. The service role is the most dangerous
 * client in the codebase and is granted only on the CRON_SECRET path.
 *
 * WHY IT IS SCHEDULED SEVERAL TIMES A DAY. The 11pm scan queues parent
 * reminders for 8am Eastern and escalations for 7am Eastern. Nothing sends
 * them until this runs, and the only queue cron that existed fired once a day
 * at midnight UTC - 8pm Eastern - so a letter due at 8am would have gone out
 * twelve hours late. The schedule covers 7am and 8am Eastern in both halves of
 * the year; see vercel.json. Extra runs cost nothing: the processor only takes
 * rows whose scheduled_for has already passed, so a run with nothing due does
 * nothing.
 */

export const maxDuration = 60;

export async function POST(req: Request) {
  if (authorizeBearerSecret(req.headers.get("authorization"), process.env.CRON_SECRET)) {
    const serviceClient = createServiceRoleClient();
    await processWorkflowQueue(serviceClient);
    await processCommunicationQueue(serviceClient);
    return NextResponse.json({ success: true, triggeredBy: "cron" });
  }

  const supabase = await createAuthClient();
  const gate = await guardApiRoute(supabase, "admissions.manage");
  if (gate instanceof NextResponse) return gate;

  await processWorkflowQueue(supabase);
  await processCommunicationQueue(supabase);
  return NextResponse.json({ success: true, triggeredBy: "human" });
}

export async function GET(req: Request) {
  return POST(req);
}
