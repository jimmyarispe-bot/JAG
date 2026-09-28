import { describe, expect, it } from "vitest";

import { planApplicationForAcceptance } from "@/lib/admissions/application-for-accepted-lead";

/**
 * The branch that decided nothing.
 *
 * submitAdmissionsDecision guarded its final step with `if (applicationId)`,
 * and for every lead but one that value is null - so accepting a family
 * recorded the decision, emailed them, and generated no contract, in silence.
 *
 * These are the four answers that guard should have had.
 */

const base = {
  existingApplicationId: null as string | null,
  currentSchoolYearId: "year-2026-2027",
  schoolName: "The Academy GA",
};

describe("only an acceptance needs a contract", () => {
  for (const decisionType of ["deny", "waitlist", "request_info"]) {
    it(`does nothing for a ${decisionType}`, () => {
      expect(planApplicationForAcceptance({ ...base, decisionType })).toEqual({
        action: "not_needed",
      });
    });
  }
});

describe("an acceptance", () => {
  it("uses the application the family already has", () => {
    expect(
      planApplicationForAcceptance({
        ...base,
        decisionType: "accept",
        existingApplicationId: "app-1",
      })
    ).toEqual({ action: "use_existing", applicationId: "app-1" });
  });

  it("creates one against the campus's current year when there is none", () => {
    expect(planApplicationForAcceptance({ ...base, decisionType: "accept" })).toEqual({
      action: "create",
      schoolYearId: "year-2026-2027",
    });
  });

  it("prefers the existing application over creating a second", () => {
    // Two applications for one child is two enrollment packets and two
    // contracts, which is worse than none.
    const plan = planApplicationForAcceptance({
      ...base,
      decisionType: "accept",
      existingApplicationId: "app-1",
    });
    expect(plan.action).not.toBe("create");
  });
});

describe("when it cannot", () => {
  it("refuses rather than creating an application attached to nothing", () => {
    const plan = planApplicationForAcceptance({
      ...base,
      decisionType: "accept",
      currentSchoolYearId: null,
    });
    expect(plan.action).toBe("refuse");
  });

  it("names the campus and says the decision is still recorded", () => {
    const plan = planApplicationForAcceptance({
      ...base,
      decisionType: "accept",
      currentSchoolYearId: null,
      schoolName: "The Academy Virtual",
    });
    if (plan.action !== "refuse") throw new Error("expected a refusal");
    expect(plan.reason).toContain("The Academy Virtual");
    expect(plan.reason).toContain("no current school year");
    // Losing an acceptance would be worse than losing the packet. The message
    // has to say which of the two happened.
    expect(plan.reason).toContain("decision is recorded");
  });

  it("says plainly that no packet was generated", () => {
    const plan = planApplicationForAcceptance({
      ...base,
      decisionType: "accept",
      currentSchoolYearId: null,
    });
    if (plan.action !== "refuse") throw new Error("expected a refusal");
    expect(plan.reason).toContain("no enrollment packet was generated");
  });
});
