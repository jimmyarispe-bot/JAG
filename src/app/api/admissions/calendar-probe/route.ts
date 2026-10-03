import { NextRequest, NextResponse } from "next/server";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { guardApiRoute } from "@/lib/platform/identity/api-guard";
import { getPrimaryOrganizationId } from "@/lib/configuration/context";
import { ensureGoogleWorkspaceAccessToken } from "@/lib/platform/integrations/google-workspace/sync/token-bridge";

/**
 * What can the shared calendar account actually see?
 *
 * READ ONLY. This route writes nothing, anywhere. It exists to answer four
 * questions with live data before a single line of the nightly scan is
 * written, because every one of them was verified by hand in Google's own
 * interface on 1 October and none of them has been verified through the code
 * path the job will actually use.
 *
 *   1. Does the stored token still work, and does it carry the calendar
 *      scope? The connection has sat unused since September.
 *   2. Which calendars can thejagcalendar@theacademyway.org see? It should be
 *      three - Nina's, Danni's and Heather's. Heather's one pair of booking
 *      links covers both her campuses, so there is no fourth.
 *   3. Do booking events actually carry the parent's email address? This is
 *      the whole matching key. HS and Virtual share booking links, so an event
 *      can never say which campus it belongs to; the address the parent typed
 *      is the only thing that connects a booking to a family.
 *   4. In which field does it arrive - attendees, creator, organizer, or only
 *      in the description? The answer decides how the matcher is written.
 *
 * WHY A ROUTE RATHER THAN A SCRIPT. The token is encrypted at rest with a key
 * the application holds. Reading it anywhere else means copying that key
 * somewhere it should not be.
 *
 * DELETE THIS ONCE THE SCAN IS BUILT AND TRUSTED. It returns families' email
 * addresses to whoever can open it, which is the right trade for a few days
 * of building and the wrong one to leave lying about.
 */

export const maxDuration = 60;

const CALENDAR = "https://www.googleapis.com/calendar/v3";

/** Same gate the Google sync route uses. In practice: Jimmy and Danni. */
async function guard(supabase: Awaited<ReturnType<typeof createAuthClient>>) {
  for (const permission of [
    "integration.manage",
    "integration.admin",
    "configuration.manage",
    "configuration.admin",
  ] as const) {
    const gate = await guardApiRoute(supabase, permission);
    if (!(gate instanceof NextResponse)) return gate;
  }
  return NextResponse.json({ ok: false, message: "Not permitted." }, { status: 403 });
}

type GEvent = {
  id?: string;
  status?: string;
  summary?: string;
  description?: string;
  start?: { dateTime?: string; date?: string; timeZone?: string };
  end?: { dateTime?: string; date?: string };
  creator?: { email?: string; self?: boolean };
  organizer?: { email?: string; self?: boolean };
  attendees?: { email?: string; responseStatus?: string; organizer?: boolean; self?: boolean }[];
};

export async function GET(request: NextRequest) {
  const supabase = await createAuthClient();
  const gate = await guard(supabase);
  if (gate instanceof NextResponse) return gate;

  const organizationId = await getPrimaryOrganizationId(supabase);
  if (!organizationId) {
    return NextResponse.json({ ok: false, message: "No organization." }, { status: 400 });
  }

  const tokens = await ensureGoogleWorkspaceAccessToken(supabase, organizationId);
  if ("error" in tokens) {
    return NextResponse.json(
      { ok: false, step: "token", message: tokens.error },
      { status: 400 }
    );
  }

  const auth = { Authorization: `Bearer ${tokens.accessToken}` };

  /* ---------------------------------------------------------------- 1 */
  const listRes = await fetch(`${CALENDAR}/users/me/calendarList?maxResults=50`, {
    headers: auth,
    cache: "no-store",
  });
  const listBody = await listRes.text();

  if (!listRes.ok) {
    /*
     * Said in full rather than summarised. A 403 here is most likely the
     * calendar scope never having been granted, and the body says which -
     * "insufficient authentication scopes" is a different problem from
     * "invalid credentials", and guessing between them wastes a day.
     */
    return NextResponse.json({
      ok: false,
      step: "calendarList",
      httpStatus: listRes.status,
      google: listBody.slice(0, 1200),
      tokenWasRefreshed: tokens.refreshed,
      hint:
        listRes.status === 403
          ? "Probably the calendar.readonly scope was never granted. Reconnecting with the calendar scope is the fix, not a code change."
          : null,
    }, { status: 200 });
  }

  const calendars = (JSON.parse(listBody).items ?? []) as {
    id?: string; summary?: string; accessRole?: string; primary?: boolean;
  }[];

  /* ---------------------------------------------------------------- 2 */
  const days = Number(request.nextUrl.searchParams.get("days") ?? 30);
  const timeMin = new Date(Date.now() - days * 864e5).toISOString();
  const timeMax = new Date(Date.now() + 90 * 864e5).toISOString();

  const perCalendar = [];
  for (const cal of calendars) {
    if (!cal.id) continue;

    const qs = new URLSearchParams({
      timeMin, timeMax,
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "40",
    });
    const evRes = await fetch(`${CALENDAR}/calendars/${encodeURIComponent(cal.id)}/events?${qs}`, {
      headers: auth,
      cache: "no-store",
    });

    if (!evRes.ok) {
      perCalendar.push({
        calendar: cal.summary ?? cal.id,
        id: cal.id,
        accessRole: cal.accessRole,
        error: `${evRes.status}: ${(await evRes.text()).slice(0, 300)}`,
      });
      continue;
    }

    const events = ((await evRes.json()).items ?? []) as GEvent[];

    perCalendar.push({
      calendar: cal.summary ?? cal.id,
      id: cal.id,
      accessRole: cal.accessRole,
      primary: Boolean(cal.primary),
      eventCount: events.length,
      /*
       * Everything a matcher could key on, for each event, so the shape is
       * decided from what Google sends rather than from what we hope it
       * sends. Capped at 12 - this is a look, not an export.
       */
      sample: events.slice(0, 12).map((e) => ({
        summary: e.summary ?? null,
        status: e.status ?? null,
        startsAt: e.start?.dateTime ?? e.start?.date ?? null,
        startTimeZone: e.start?.timeZone ?? null,
        creator: e.creator?.email ?? null,
        organizer: e.organizer?.email ?? null,
        attendees: (e.attendees ?? []).map((a) => a.email).filter(Boolean),
        /* The address is sometimes only in the body of an appointment-schedule
           booking. Length and a flag rather than the text, which can be long. */
        descriptionHasAtSign: Boolean(e.description && e.description.includes("@")),
        descriptionLength: e.description?.length ?? 0,
      })),
    });
  }

  return NextResponse.json({
    ok: true,
    askedFor: { sinceDays: days, window: [timeMin, timeMax] },
    tokenWasRefreshed: tokens.refreshed,
    calendarsVisible: calendars.length,
    expected:
      "Three shared calendars plus this account's own primary. Nina, Danni and Heather - " +
      "Heather's single pair of booking links covers both HS and Virtual, so there is no fourth.",
    whatToLookFor:
      "On a real booking, is the parent's address in 'attendees'? If it is, the matcher keys on " +
      "that. If it is only in the description, the matcher has to read the body, and that is a " +
      "different and more fragile job worth knowing about now.",
    perCalendar,
  });
}
