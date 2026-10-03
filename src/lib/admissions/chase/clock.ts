/**
 * Whether a family gets chased tonight, and when the letter should land.
 *
 * PURE ON PURPOSE. No Supabase, no Google, no clock of its own - every input
 * is handed in, including `now`. That is what lets the whole schedule be
 * tested against invented calendars instead of waited out in real days, and it
 * is the only part of the chase where a mistake reaches a family directly.
 *
 * JIMMY'S CLOCK, 3 October 2026, in his words:
 *
 *   "If we haven't received the google calendar appt by the 2nd day @ 11pm est
 *   after receiving the initial inquiry then send the 1st followup email. if
 *   we don't receive it by the next day by 11pm est then send the 2nd followup
 *   email. if they don't schedule by the 3rd day @ 11pm est then send an email
 *   to the school leader the next morning at 7am est"
 *
 * As typed, the 2nd follow-up and the escalation are both decided at the day-3
 * checkpoint, which would have a school leader told to call at 7am while the
 * family's own second letter was still sitting in the morning queue. Put to
 * him the same day; he chose to move the escalation to the day-4 checkpoint so
 * the family gets a working day to answer. His eight-hour rule from 2 October
 * survives exactly: 11:00pm to 7:00am.
 *
 *   day 0          the inquiry arrives; the booking link goes out
 *   day 2, 11pm    no appointment -> 1st follow-up, read next morning
 *   day 3, 11pm    still none      -> 2nd follow-up, read next morning
 *   day 4, 11pm    still none      -> the school leader, 7:00am the next day
 *
 * CALENDAR DAYS, NOT ELAPSED HOURS. See easternDaysBetween. "The 2nd day after
 * the inquiry" is a date, and two families who inquired twelve minutes apart
 * either side of midnight should not be chased a day apart.
 *
 * THE CHECKPOINTS ARE >=, NOT ==. If the scan does not run one night - a
 * deploy, an outage, an expired Google token - a family must be picked up the
 * following night rather than skipped for ever. An == would have silently
 * written off every family whose checkpoint fell on the bad night, and left no
 * trace that it had.
 */

import {
  easternDateKey,
  easternDateKeyPlusDays,
  easternDaysBetween,
  easternInstant,
  easternWeekdayOfKey,
  nextEasternWeekdayKey,
} from "@/lib/platform/time/eastern";

/** The hour a family reads a follow-up. Morning, not midnight. */
export const REMINDER_HOUR_EASTERN = 8;

/** Jimmy's hour for the school leader. "the next morning at 7am est". */
export const ESCALATION_HOUR_EASTERN = 7;

/** The checkpoints, as whole days after the inquiry. */
export const REMINDER_1_DAY = 2;
export const REMINDER_2_DAY = 3;
export const ESCALATION_DAY = 4;

export interface ChaseInput {
  /** When the scan is running. Eastern 11pm, in practice. */
  readonly now: Date;
  /** Day 0. */
  readonly inquiryAt: Date;
  /**
   * When the family was actually sent a booking link, or null if they never
   * were. Null stops the chase dead - see `no_link_was_ever_sent`.
   */
  readonly bookingLinkSentAt: Date | null;
  /** An interest meeting exists on a calendar. The chase is over. */
  readonly bookedAt: Date | null;
  readonly reminder1SentAt: Date | null;
  readonly reminder2SentAt: Date | null;
  readonly escalatedAt: Date | null;
  /** Current lead stage, to leave alone anything that has moved on. */
  readonly leadStage: string;
  /** A leader has recorded a phone call. Automatic chasing stops. */
  readonly callRecordedAt: Date | null;
  /**
   * Hold a 7am escalation that lands on a Saturday or Sunday until Monday.
   *
   * No default, deliberately. It decides whether a school leader is told to
   * telephone a family at seven o'clock on a Saturday morning, and that is not
   * a question a module should answer quietly on someone's behalf. The caller
   * passes true today - my recommendation, pending Jimmy's word - and it is
   * one argument to flip.
   */
  readonly holdWeekendEscalation: boolean;
}

export type ChaseDecision =
  | { readonly action: "nothing"; readonly because: ChaseReason }
  | { readonly action: "reminder"; readonly which: 1 | 2; readonly sendAt: Date }
  | { readonly action: "escalate"; readonly sendAt: Date; readonly heldForWeekend: boolean };

export type ChaseReason =
  | "already_booked"
  | "no_link_was_ever_sent"
  | "lead_has_moved_on"
  | "a_leader_has_called"
  | "already_escalated"
  | "too_early";

/**
 * Stages where chasing a family about an interest meeting would be wrong.
 *
 * Two kinds. The ones that have passed the meeting - a family who has applied
 * does not need reminding to come and talk to us - and the ones where the
 * answer is already no. `declined` and `not_returning` are in the second
 * group, and leaving them out would have the platform emailing a family twice
 * more after telling them we are not going ahead.
 */
const STAGES_PAST_CHASING: ReadonlySet<string> = new Set([
  "interview_scheduled",
  "interest_meeting_held",
  "assessment_scheduled",
  "application_started",
  "application_submitted",
  "records_requested",
  "admissions_review",
  "shadow_day_scheduled",
  "shadow_day_completed",
  "accepted",
  "waitlisted",
  "declined",
  "not_returning",
  "enrolled",
]);

export function decideChase(input: ChaseInput): ChaseDecision {
  if (input.bookedAt) return { action: "nothing", because: "already_booked" };
  if (input.callRecordedAt) return { action: "nothing", because: "a_leader_has_called" };
  if (STAGES_PAST_CHASING.has(input.leadStage)) {
    return { action: "nothing", because: "lead_has_moved_on" };
  }

  /*
   * THE GUARD. The clock runs from the inquiry, because that is what Jimmy
   * said and because it is the moment the family did something. The booking
   * link goes out separately - today with the thank-you letter, and only when
   * the campus actually has a booking URL; a campus without one is sent the
   * no-link version that promises a person will be in touch.
   *
   * So a family can reach day 2 having never been given anything to click. To
   * chase them for not booking would be the platform blaming a parent for a
   * thing the school never asked them to do.
   */
  if (!input.bookingLinkSentAt) {
    return { action: "nothing", because: "no_link_was_ever_sent" };
  }

  const day = easternDaysBetween(input.inquiryAt, input.now);
  const today = easternDateKey(input.now);
  const tomorrow = easternDateKeyPlusDays(today, 1);

  if (day >= REMINDER_1_DAY && !input.reminder1SentAt) {
    return {
      action: "reminder",
      which: 1,
      sendAt: easternInstant(tomorrow, REMINDER_HOUR_EASTERN),
    };
  }

  if (day >= REMINDER_2_DAY && input.reminder1SentAt && !input.reminder2SentAt) {
    return {
      action: "reminder",
      which: 2,
      sendAt: easternInstant(tomorrow, REMINDER_HOUR_EASTERN),
    };
  }

  if (day >= ESCALATION_DAY && input.reminder2SentAt) {
    if (input.escalatedAt) return { action: "nothing", because: "already_escalated" };

    const naturalDay = tomorrow;
    const landsOnWeekend = [0, 6].includes(easternWeekdayOfKey(naturalDay));
    const sendDay =
      input.holdWeekendEscalation && landsOnWeekend
        ? nextEasternWeekdayKey(naturalDay)
        : naturalDay;

    return {
      action: "escalate",
      sendAt: easternInstant(sendDay, ESCALATION_HOUR_EASTERN),
      heldForWeekend: sendDay !== naturalDay,
    };
  }

  return { action: "nothing", because: "too_early" };
}

/**
 * ONE REMINDER PER NIGHT, AND IN ORDER.
 *
 * A family found on day 5 having had nothing sent gets reminder 1 tonight and
 * reminder 2 tomorrow night, not both at once and not the escalation first.
 * decideChase already produces that behaviour, because each branch requires
 * the previous letter to have been sent; this is the statement of intent, so
 * that if someone later rearranges the branches the thing they broke has a
 * name.
 *
 * It matters most in exactly the case it is hardest to notice: the first night
 * the scan runs against families who have been sitting in the pipeline for
 * weeks. Without the ordering, every one of them would be escalated to a phone
 * call on the same morning, having never been emailed at all.
 */
export const CHASE_INVARIANT =
  "At most one letter per family per night, in order, and never the escalation " +
  "before both reminders have actually been sent.";
