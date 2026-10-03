import { describe, it, expect } from "vitest";

import {
  easternDateKey,
  easternDaysBetween,
  easternHour,
  easternInstant,
  easternOffsetMinutes,
  nextEasternWeekdayKey,
} from "@/lib/platform/time/eastern";
import {
  decideChase,
  ESCALATION_HOUR_EASTERN,
  REMINDER_HOUR_EASTERN,
  type ChaseInput,
} from "@/lib/admissions/chase/clock";

/* -------------------------------------------------------------------------- */
/* Eastern time                                                               */
/* -------------------------------------------------------------------------- */

describe("eastern time", () => {
  it("is four hours behind UTC in the school year", () => {
    expect(easternOffsetMinutes(new Date("2026-10-03T12:00:00Z"))).toBe(-240);
  });

  it("is five hours behind after the clocks change", () => {
    // Daylight saving ends on the first Sunday in November - 1 November 2026.
    expect(easternOffsetMinutes(new Date("2026-11-15T12:00:00Z"))).toBe(-300);
  });

  it("builds 11pm Eastern as the right instant on both sides of the change", () => {
    expect(easternInstant("2026-10-15", 23).toISOString()).toBe("2026-10-16T03:00:00.000Z");
    expect(easternInstant("2026-11-15", 23).toISOString()).toBe("2026-11-16T04:00:00.000Z");
  });

  it("round-trips: an instant built for 7am Eastern reads as 7am Eastern", () => {
    for (const key of ["2026-03-10", "2026-07-04", "2026-11-02", "2026-12-25"]) {
      const at = easternInstant(key, ESCALATION_HOUR_EASTERN);
      expect(easternHour(at)).toBe(ESCALATION_HOUR_EASTERN);
      expect(easternDateKey(at)).toBe(key);
    }
  });

  /*
   * The reason easternDaysBetween exists. Under UTC arithmetic both of these
   * instants fall on 6 October, because 8pm Eastern is already tomorrow in
   * UTC - so a family who inquired on Monday evening would be chased a day
   * early, and a family who inquired Tuesday morning on the same schedule.
   */
  it("counts calendar days in Eastern, not in UTC", () => {
    const mondayEvening = new Date("2026-10-06T00:30:00Z"); // 8:30pm Mon 5 Oct ET
    const tuesdayMorning = new Date("2026-10-06T13:00:00Z"); // 9:00am Tue 6 Oct ET

    expect(easternDateKey(mondayEvening)).toBe("2026-10-05");
    expect(easternDateKey(tuesdayMorning)).toBe("2026-10-06");
    expect(easternDaysBetween(mondayEvening, tuesdayMorning)).toBe(1);
  });

  it("skips the weekend when asked for the next weekday", () => {
    expect(nextEasternWeekdayKey("2026-10-10")).toBe("2026-10-12"); // Sat -> Mon
    expect(nextEasternWeekdayKey("2026-10-11")).toBe("2026-10-12"); // Sun -> Mon
    expect(nextEasternWeekdayKey("2026-10-09")).toBe("2026-10-09"); // Fri stays
  });
});

/* -------------------------------------------------------------------------- */
/* The chase                                                                  */
/* -------------------------------------------------------------------------- */

/** Monday 5 October 2026, 9:00am Eastern. Day 0. */
const INQUIRY = new Date("2026-10-05T13:00:00Z");

/** 11pm Eastern on the given day after the inquiry. */
function scanNightOfDay(day: number): Date {
  const key = ["2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09"][day];
  return easternInstant(key, 23);
}

function input(over: Partial<ChaseInput> = {}): ChaseInput {
  return {
    now: scanNightOfDay(2),
    inquiryAt: INQUIRY,
    bookingLinkSentAt: INQUIRY,
    bookedAt: null,
    reminder1SentAt: null,
    reminder2SentAt: null,
    escalatedAt: null,
    leadStage: "new_inquiry",
    callRecordedAt: null,
    holdWeekendEscalation: true,
    ...over,
  };
}

describe("the chase clock", () => {
  it("does nothing on the night of the inquiry or the night after", () => {
    expect(decideChase(input({ now: scanNightOfDay(0) }))).toEqual({
      action: "nothing",
      because: "too_early",
    });
    expect(decideChase(input({ now: scanNightOfDay(1) }))).toEqual({
      action: "nothing",
      because: "too_early",
    });
  });

  it("sends the first follow-up at the day-2 checkpoint, to arrive next morning", () => {
    const decision = decideChase(input({ now: scanNightOfDay(2) }));
    expect(decision.action).toBe("reminder");
    if (decision.action !== "reminder") throw new Error("unreachable");
    expect(decision.which).toBe(1);
    /*
     * The inquiry is Monday 5 October, so the day-2 checkpoint is the night of
     * WEDNESDAY the 7th and the family reads the letter on the morning of
     * THURSDAY the 8th. Written out because the first draft of this test
     * asserted the 7th - reading "day 2" as the day the letter arrives rather
     * than the night it is decided - and the code was right.
     */
    expect(easternDateKey(decision.sendAt)).toBe("2026-10-08");
    expect(easternHour(decision.sendAt)).toBe(REMINDER_HOUR_EASTERN);
  });

  it("sends the second at day 3, but only once the first has actually gone", () => {
    const firstNotSent = decideChase(
      input({ now: scanNightOfDay(3), reminder1SentAt: null })
    );
    expect(firstNotSent.action).toBe("reminder");
    if (firstNotSent.action !== "reminder") throw new Error("unreachable");
    expect(firstNotSent.which).toBe(1);

    const firstSent = decideChase(
      input({ now: scanNightOfDay(3), reminder1SentAt: scanNightOfDay(2) })
    );
    expect(firstSent.action).toBe("reminder");
    if (firstSent.action !== "reminder") throw new Error("unreachable");
    expect(firstSent.which).toBe(2);
  });

  it("escalates at day 4, at 7am, eight hours after the checkpoint", () => {
    const decision = decideChase(
      input({
        now: scanNightOfDay(4),
        reminder1SentAt: scanNightOfDay(2),
        reminder2SentAt: scanNightOfDay(3),
      })
    );
    expect(decision.action).toBe("escalate");
    if (decision.action !== "escalate") throw new Error("unreachable");
    expect(easternHour(decision.sendAt)).toBe(7);

    // Friday 9 October's 11pm checkpoint -> Saturday, held to Monday 12th.
    expect(easternDateKey(decision.sendAt)).toBe("2026-10-12");
    expect(decision.heldForWeekend).toBe(true);
  });

  it("escalates on the actual next morning when the weekend hold is off", () => {
    const decision = decideChase(
      input({
        now: scanNightOfDay(4),
        reminder1SentAt: scanNightOfDay(2),
        reminder2SentAt: scanNightOfDay(3),
        holdWeekendEscalation: false,
      })
    );
    if (decision.action !== "escalate") throw new Error("unreachable");
    expect(easternDateKey(decision.sendAt)).toBe("2026-10-10"); // Saturday
    expect(decision.heldForWeekend).toBe(false);
  });

  /*
   * THE ONE THAT WOULD HAVE HURT. The first night this runs, the pipeline is
   * full of families who inquired weeks ago and have never been chased. Each
   * must start at the first letter, not be telephoned about on the same
   * morning as every other.
   */
  it("starts a long-neglected family at the first letter, not the escalation", () => {
    const threeWeeksLater = easternInstant("2026-10-26", 23);
    const decision = decideChase(input({ now: threeWeeksLater }));
    expect(decision.action).toBe("reminder");
    if (decision.action !== "reminder") throw new Error("unreachable");
    expect(decision.which).toBe(1);
  });

  it("picks a family up the next night if the scan missed one", () => {
    // Nothing ran on day 2. Day 3 must still send the first letter.
    const decision = decideChase(input({ now: scanNightOfDay(3) }));
    if (decision.action !== "reminder") throw new Error("unreachable");
    expect(decision.which).toBe(1);
  });

  it("stops the moment a booking exists", () => {
    expect(
      decideChase(input({ now: scanNightOfDay(4), bookedAt: new Date("2026-10-06T14:00:00Z") }))
    ).toEqual({ action: "nothing", because: "already_booked" });
  });

  it("never chases a family who was never sent a link", () => {
    expect(decideChase(input({ bookingLinkSentAt: null }))).toEqual({
      action: "nothing",
      because: "no_link_was_ever_sent",
    });
  });

  it("leaves alone anyone who has moved on, including a declined family", () => {
    for (const stage of [
      "interview_scheduled",
      "application_submitted",
      "shadow_day_completed",
      "declined",
      "not_returning",
      "enrolled",
    ]) {
      expect(decideChase(input({ now: scanNightOfDay(4), leadStage: stage }))).toEqual({
        action: "nothing",
        because: "lead_has_moved_on",
      });
    }
  });

  it("stops once a school leader has recorded a call", () => {
    expect(
      decideChase(
        input({
          now: scanNightOfDay(4),
          reminder1SentAt: scanNightOfDay(2),
          reminder2SentAt: scanNightOfDay(3),
          callRecordedAt: scanNightOfDay(4),
        })
      )
    ).toEqual({ action: "nothing", because: "a_leader_has_called" });
  });

  it("escalates exactly once", () => {
    expect(
      decideChase(
        input({
          now: scanNightOfDay(4),
          reminder1SentAt: scanNightOfDay(2),
          reminder2SentAt: scanNightOfDay(3),
          escalatedAt: scanNightOfDay(4),
        })
      )
    ).toEqual({ action: "nothing", because: "already_escalated" });
  });

  /*
   * Two families a dozen minutes apart either side of midnight. Under elapsed
   * hours the earlier one is chased a day before the later one despite having
   * inquired almost at the same moment.
   */
  it("treats two families either side of midnight as inquiring on different days", () => {
    const lateMonday = new Date("2026-10-06T03:55:00Z"); // 11:55pm Mon 5 Oct ET
    const earlyTuesday = new Date("2026-10-06T04:05:00Z"); // 12:05am Tue 6 Oct ET

    const night = easternInstant("2026-10-07", 23); // day 2 for the first only

    const first = decideChase(
      input({ now: night, inquiryAt: lateMonday, bookingLinkSentAt: lateMonday })
    );
    const second = decideChase(
      input({ now: night, inquiryAt: earlyTuesday, bookingLinkSentAt: earlyTuesday })
    );

    expect(first.action).toBe("reminder");
    expect(second).toEqual({ action: "nothing", because: "too_early" });
  });
});
