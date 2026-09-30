import { describe, expect, it } from "vitest";
import { planApplicationForInvite } from "@/lib/admissions/application-for-invited-lead";

/**
 * An invitation has to produce the thing the family pays on.
 *
 * Jimmy, 28 September: the $100 goes "at the end of the application and
 * before it can be submitted". The fee lives on admissions_applications, and
 * that row used to be created only when a family was ACCEPTED - so the fee
 * had nowhere to live during the step it was meant to gate.
 *
 * Every wrong answer below is either a family invited with nowhere to pay, a
 * duplicate application, or money attached to a school year nobody chose.
 */

const base = {
  existingApplicationId: null,
  schoolId: "school-1",
  currentSchoolYearId: "year-1",
  schoolName: "The Academy GA",
};

describe("planApplicationForInvite", () => {
  it("creates one when the family has none", () => {
    expect(planApplicationForInvite(base)).toEqual({
      action: "create",
      schoolYearId: "year-1",
    });
  });

  it("uses the application a re-invited family already has", () => {
    /*
     * A family re-invited after a bounced address must land on the
     * application they already have, with whatever they have already paid
     * against it. A second row would be a second $100.
     */
    expect(
      planApplicationForInvite({ ...base, existingApplicationId: "app-9" })
    ).toEqual({ action: "use_existing", applicationId: "app-9" });
  });

  it("refuses when the campus has no current school year", () => {
    /*
     * Refused, not guessed. Money attached to the wrong year is harder to
     * find than a missing row, and the message has to say what to do.
     */
    const plan = planApplicationForInvite({ ...base, currentSchoolYearId: null });
    expect(plan.action).toBe("refuse");
    if (plan.action === "refuse") {
      expect(plan.reason).toContain("The Academy GA");
      expect(plan.reason).toContain("current school year");
      expect(plan.reason).toContain("not been emailed");
    }
  });

  it("refuses when the student has no campus", () => {
    const plan = planApplicationForInvite({
      ...base,
      schoolId: null,
      currentSchoolYearId: null,
    });
    expect(plan.action).toBe("refuse");
    if (plan.action === "refuse") {
      expect(plan.reason).toContain("no school on their record");
    }
  });

  it("prefers the existing application over every refusal", () => {
    /*
     * A family who already has an application can be re-invited even if
     * their campus has since lost its current year. The row exists; nothing
     * needs creating; refusing would block an invitation for no reason.
     */
    expect(
      planApplicationForInvite({
        ...base,
        existingApplicationId: "app-9",
        schoolId: null,
        currentSchoolYearId: null,
      })
    ).toEqual({ action: "use_existing", applicationId: "app-9" });
  });
});
