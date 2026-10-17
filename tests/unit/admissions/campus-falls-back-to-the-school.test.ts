import { describe, it, expect } from "vitest";

import { buildMergeContextFromParts } from "@/lib/admissions/communications/engine";
import { buildMergeValues } from "@/lib/admissions/communications/merge-fields";

/**
 * WHAT THIS IS ABOUT.
 *
 * 17 October 2026, 12:00pm Eastern. Vanessa Carvajal was sent Gabby's tour
 * confirmation for Wednesday the 21st at 9:30am. It read:
 *
 *   Address: we will confirm this with you — please reply to this email
 *
 * The Academy FL's address had been in the database since 10 October.
 *
 * `admissions_tours.campus_id` is NULL on the rows the booking scan writes,
 * so the appointment carried no campus, and buildMergeContextFromParts took
 * the appointment's campus and stopped — while every other school-derived
 * field beside it read schoolOf(lead). Two other builders in the same file
 * already had the fallback; this one was missed, and nothing failed when it
 * was, which is why it reached a mother planning a drive.
 *
 * The "we will confirm this with you" wording is correct and stays. It is
 * for the case where nobody knows the address. We knew.
 */

const FL_ADDRESS =
  "1420 Southeast Floresta Drive, Port Saint Lucie, Florida 34983 — in the back of the church, at the awning";

/** Only the fields these assertions touch; the rest of the row is irrelevant. */
function leadAt(school: { name: string | null; address: string | null } | null) {
  return {
    id: "lead-1",
    school_id: "school-1",
    first_name: "Gabby",
    last_name: "Carvajal",
    preferred_name: "Gabby",
    guardian_first_name: "Vanessa",
    guardian_last_name: "Carvajal",
    schools: school,
  } as unknown as Parameters<typeof buildMergeContextFromParts>[0];
}

const NO_APPOINTMENT_CAMPUS = {
  tourDatetime: "Wednesday, October 21, 2026 @ 9:30 AM",
  campusName: null,
  campusAddress: null,
};

describe("the campus falls back to the school", () => {
  it("uses the school's address when the tour has no campus", () => {
    const ctx = buildMergeContextFromParts(
      leadAt({ name: "The Academy FL", address: FL_ADDRESS }),
      [],
      [],
      NO_APPOINTMENT_CAMPUS,
      []
    );
    expect(ctx.campusAddress).toBe(FL_ADDRESS);
    expect(ctx.campusName).toBe("The Academy FL");
  });

  /*
   * The rendered value is what actually reached Vanessa, so the assertion
   * that matters most is made against merge-fields rather than the context:
   * a context that is right and a letter that is wrong is the gap this bug
   * lived in.
   */
  it("renders the real address into {{campus_address}}, not the apology", () => {
    const values = buildMergeValues(
      buildMergeContextFromParts(
        leadAt({ name: "The Academy FL", address: FL_ADDRESS }),
        [],
        [],
        NO_APPOINTMENT_CAMPUS,
        []
      )
    );
    expect(values.campus_address).toBe(FL_ADDRESS);
    expect(values.campus_address).not.toContain("we will confirm this with you");
    expect(values.campus_name).toBe("The Academy FL");
  });

  it("still prefers the appointment's own campus when it has one", () => {
    const ctx = buildMergeContextFromParts(
      leadAt({ name: "The Academy FL", address: FL_ADDRESS }),
      [],
      [],
      {
        tourDatetime: null,
        campusName: "Academy FL Campus",
        campusAddress: "A different door on the same street",
      },
      []
    );
    expect(ctx.campusAddress).toBe("A different door on the same street");
    expect(ctx.campusName).toBe("Academy FL Campus");
  });

  /*
   * When NOBODY knows, the apology is the right answer and must survive.
   * A fallback that quietly invents an address is worse than one that asks.
   */
  it("still asks the family to reply when no address exists anywhere", () => {
    const values = buildMergeValues(
      buildMergeContextFromParts(
        leadAt({ name: "The Academy Virtual", address: null }),
        [],
        [],
        NO_APPOINTMENT_CAMPUS,
        []
      )
    );
    expect(values.campus_address).toBe(
      "we will confirm this with you — please reply to this email"
    );
  });

  it("survives a lead with no school at all", () => {
    const ctx = buildMergeContextFromParts(leadAt(null), [], [], NO_APPOINTMENT_CAMPUS, []);
    expect(ctx.campusAddress).toBeNull();
    expect(ctx.campusName).toBeNull();
  });
});
