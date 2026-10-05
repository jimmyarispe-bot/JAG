import "server-only";

/**
 * Reading the three shared calendars, and nothing else.
 *
 * WHAT THE PROBE ESTABLISHED, 2 October 2026, against live Google through this
 * exact token and endpoint - not by looking at Google's own interface, which
 * is how the four assumptions below were "verified" the first time:
 *
 *   The token works and carries the calendar scope. It refreshed itself.
 *
 *   FOUR calendars are visible, not three. The shared account's own empty
 *   primary, "Holidays in United States", Nina's and Heather's. DANNI'S IS NOT
 *   SHARED, which leaves The Academy FL with no calendar this job can see. A
 *   family at FL would be chased three times and escalated to a telephone call
 *   however promptly they booked. Reported, loudly, rather than worked around
 *   - see `campusesWithNoCalendar`.
 *
 *   The parent's address is in `attendees`. This was the question that could
 *   have sunk the approach, and it is the good answer: the matcher is an exact
 *   comparison rather than a parse of an email body.
 *
 *     "30 min with Nina (Lisa Roy)"
 *       attendees: lisinda1974@gmail.com, nina.gaddy@theacademyga.org
 *     "Rita & Mike Fink (Emma) Phone Call"
 *       attendees: arizonasasquatch@gmail.com, rfink5517@gmail.com,
 *                  heather.brown@theacademyway.org
 *
 *   Times carry their own offset - "2026-09-11T15:00:00-04:00" with
 *   startTimeZone "America/New_York" - so appointmentTextForFamily renders the
 *   hour a parent will actually turn up at. That is the fault that told three
 *   families the wrong time on 1 October, and it cannot repeat through here.
 *
 * WHICH CALENDARS COUNT, AND WHY IT IS AN EXCLUSION. The obvious rule is to
 * list the school domains and keep those. The obvious rule is wrong: the next
 * campus, or the next leader on a different domain, would be dropped in
 * silence - which is exactly the Danni fault a second time and harder to see.
 * So everything is read except the two things that provably are not staff
 * calendars: Google's own group calendars (holidays, resources), whose ids
 * live at *.calendar.google.com or contain a '#', and nothing else.
 *
 * AN EVENT WITH NO ATTENDEES CANNOT BE A BOOKING. "Office", "Lunch Break",
 * "Class with Mrs. BB" - the calendars are full of them, and none can ever
 * match a family. Dropping them here keeps the matching set small and honest
 * rather than filtering them out later by name, which would be a guess about
 * what people call things.
 */

const CALENDAR_API = "https://www.googleapis.com/calendar/v3";

/** Google's own generated calendars. Holidays, rooms, resources. */
function isGoogleGeneratedCalendar(id: string): boolean {
  if (id.includes("#")) return true;
  const host = id.split("@")[1]?.toLowerCase() ?? "";
  return host.endsWith("calendar.google.com");
}

export interface CalendarBooking {
  readonly calendarId: string;
  readonly eventId: string;
  readonly summary: string | null;
  /** ISO 8601 with the offset Google supplied. Never reformatted here. */
  readonly startsAt: string;
  /**
   * When Google says the appointment ENDS, same format, null when the event
   * carries no end time.
   *
   * Captured on 4 October for one reason: the GA and FL post-call letter is
   * due "10 minutes after this scheduled phone conversation", and ten minutes
   * after it STARTS lands in the middle of it. The end time has been sitting
   * in every Google event this scan has ever read and was simply never taken.
   */
  readonly endsAt: string | null;
  /**
   * The Google Meet link for this appointment, or null.
   *
   * Null at GA and FL, where the inquiry call is a telephone call and Google
   * creates no conference for it. Read from `hangoutLink` first, which is
   * what an appointment schedule sets, and from conferenceData's video entry
   * point second, which is what a manually created event with Meet attached
   * sets instead.
   */
  readonly meetingLink: string | null;
  readonly organizerEmail: string | null;
  /** Lower-cased, de-duplicated. The matching key. */
  readonly attendeeEmails: readonly string[];
}

export interface CalendarRead {
  readonly bookings: readonly CalendarBooking[];
  readonly calendarsRead: readonly string[];
  readonly calendarsSkipped: readonly string[];
  /** Non-fatal. One calendar refusing should not lose the other two. */
  readonly problems: readonly string[];
}

type GoogleEvent = {
  id?: string;
  status?: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  hangoutLink?: string;
  conferenceData?: {
    entryPoints?: { entryPointType?: string; uri?: string }[];
  };
  organizer?: { email?: string };
  attendees?: { email?: string; responseStatus?: string }[];
};

/**
 * Where Google hides the Meet link, in the two places it puts one.
 *
 * Only a `video` entry point is accepted. conferenceData also carries `phone`
 * and `sip` entries, and mailing a school leader a dial-in PIN where she
 * expects a Meet link is worse than mailing her nothing.
 */
function meetingLinkOf(event: GoogleEvent): string | null {
  const direct = event.hangoutLink?.trim();
  if (direct) return direct;

  for (const entry of event.conferenceData?.entryPoints ?? []) {
    if (entry.entryPointType === "video" && entry.uri?.trim()) {
      return entry.uri.trim();
    }
  }
  return null;
}

async function googleJson(
  url: string,
  accessToken: string
): Promise<{ ok: true; body: unknown } | { ok: false; detail: string }> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) return { ok: false, detail: `${res.status}: ${text.slice(0, 300)}` };
  try {
    return { ok: true, body: JSON.parse(text) };
  } catch {
    return { ok: false, detail: "Google returned something that was not JSON." };
  }
}

export async function readSharedCalendarBookings(
  accessToken: string,
  window: { from: Date; to: Date }
): Promise<CalendarRead | { error: string }> {
  const listed = await googleJson(
    `${CALENDAR_API}/users/me/calendarList?maxResults=100`,
    accessToken
  );
  if (!listed.ok) {
    /*
     * The whole job stops here, and says why in full. A 403 with
     * "insufficient authentication scopes" needs a reconnection; a 401 with
     * "invalid credentials" needs a look at the token. Summarising the two
     * into "Google said no" costs a day of guessing between them.
     */
    return { error: `Could not list the calendars. ${listed.detail}` };
  }

  const items = ((listed.body as { items?: unknown[] }).items ?? []) as {
    id?: string;
    summary?: string;
  }[];

  const calendarsRead: string[] = [];
  const calendarsSkipped: string[] = [];
  const problems: string[] = [];
  const bookings: CalendarBooking[] = [];

  for (const calendar of items) {
    const id = calendar.id?.trim();
    if (!id) continue;
    if (isGoogleGeneratedCalendar(id)) {
      calendarsSkipped.push(id);
      continue;
    }
    calendarsRead.push(id.toLowerCase());

    let pageToken: string | undefined;
    /*
     * Five pages of 250 is 1250 events per calendar per run, against a window
     * the caller keeps short. The cap exists so one calendar with a decade of
     * history cannot run the job past the function timeout and take the other
     * campuses down with it; if it is ever reached that is a fact worth
     * seeing, so it is reported rather than shrugged off.
     */
    for (let page = 0; page < 5; page++) {
      const qs = new URLSearchParams({
        timeMin: window.from.toISOString(),
        timeMax: window.to.toISOString(),
        singleEvents: "true",
        orderBy: "startTime",
        maxResults: "250",
      });
      if (pageToken) qs.set("pageToken", pageToken);

      const res = await googleJson(
        `${CALENDAR_API}/calendars/${encodeURIComponent(id)}/events?${qs}`,
        accessToken
      );
      if (!res.ok) {
        problems.push(`${id}: ${res.detail}`);
        break;
      }

      const body = res.body as { items?: GoogleEvent[]; nextPageToken?: string };
      for (const event of body.items ?? []) {
        if (event.status === "cancelled") continue;

        const startsAt = event.start?.dateTime;
        /*
         * An all-day entry has `date` and no `dateTime`. An interest meeting
         * is never all day, and treating one as a booking would record a
         * meeting at midnight and tell a family to attend it.
         */
        if (!startsAt) continue;

        const emails = [
          ...new Set(
            (event.attendees ?? [])
              .map((a) => a.email?.trim().toLowerCase())
              .filter((e): e is string => Boolean(e))
          ),
        ];
        if (!emails.length) continue;

        bookings.push({
          calendarId: id.toLowerCase(),
          eventId: event.id ?? `${id}:${startsAt}`,
          summary: event.summary ?? null,
          startsAt,
          /* An all-day event is already skipped above, so a missing dateTime
             here means Google sent an event with no end - rare, and handled
             by the caller rather than guessed at with a default length. */
          endsAt: event.end?.dateTime ?? null,
          meetingLink: meetingLinkOf(event),
          organizerEmail: event.organizer?.email?.trim().toLowerCase() ?? null,
          attendeeEmails: emails,
        });
      }

      pageToken = body.nextPageToken;
      if (!pageToken) break;
      if (page === 4) problems.push(`${id}: more events than one run reads.`);
    }
  }

  return { bookings, calendarsRead, calendarsSkipped, problems };
}

/**
 * Which family, if any, this booking belongs to.
 *
 * EXACT MATCH ON THE ADDRESS THE PARENT TYPED, lower-cased, and nothing
 * cleverer. HS and Virtual share a booking link, so an event can never say
 * which campus it belongs to - the address is the only connection between a
 * booking and a family, and it is the whole reason the probe asked question
 * three before a line of this was written.
 *
 * NO FUZZY MATCHING, NO NAME MATCHING, EVER. The summary line reads "30 min
 * with Nina (Lisa Roy)" and it is tempting. A name is not a key: three
 * separate faults in the last fortnight came from matching people by name, the
 * worst of them splitting ten children into twenty records. A booking that
 * cannot be matched by address is reported as unmatched and left for a person,
 * which is slower and cannot invent a meeting for the wrong child.
 *
 * AMBIGUITY REFUSES RATHER THAN PICKS. Two guardians sharing one address - a
 * second child, or a couple who both used the same inbox - returns null and
 * says so. "Rita & Mike Fink (Emma) Phone Call" has two parent addresses on
 * it, so this is a real shape in the real data and not a hypothetical.
 */
export function matchBookingToLead(
  booking: CalendarBooking,
  leadIdByGuardianEmail: ReadonlyMap<string, readonly string[]>
): { leadId: string } | { ambiguous: string[] } | null {
  const hits = new Set<string>();
  for (const email of booking.attendeeEmails) {
    for (const leadId of leadIdByGuardianEmail.get(email) ?? []) hits.add(leadId);
  }
  if (hits.size === 0) return null;
  if (hits.size > 1) return { ambiguous: [...hits] };
  return { leadId: [...hits][0] };
}
