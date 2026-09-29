import { describe, expect, it } from "vitest";

import {
  CAMPUS_PROGRAM_OPTIONS,
  INTEREST_FORM_PROGRAM_OPTIONS,
  isInterestFormProgramValue,
} from "@/lib/admissions/interest-form/program-options";
import {
  pruneAnswersForHiddenOptions,
  validateInterestSubmission,
} from "@/lib/admissions/interest-form/definition";
import type { InterestFormDefinition } from "@/lib/admissions/interest-form/types";

const GA = "11111111-1111-1111-1111-111111111111";
const HS = "22222222-2222-2222-2222-222222222222";
const VIRTUAL = "33333333-3333-3333-3333-333333333333";

/** Options carrying the same visibleWhen shape the migration writes. */
function onlyAt(schoolIds: string[]) {
  return {
    any: schoolIds.map((id) => ({
      path: "school_id",
      op: "eq" as const,
      value: id,
    })),
  };
}

const definition: InterestFormDefinition = {
  schemaVersion: "interest_form.v1",
  title: "Admissions Inquiry",
  sections: [
    { key: "program", title: "Program & School", order: 1, questionKeys: ["school_id", "programs"] },
  ],
  questions: [
    { key: "school_id", type: "school_selector", label: "School", required: true, order: 1 },
    {
      key: "programs",
      type: "program_selector",
      label: "Program(s) of Interest",
      required: false,
      order: 2,
      options: [
        { value: "In-Person", label: "In-Person", visibleWhen: onlyAt([GA, VIRTUAL]) },
        { value: "Only Virtual", label: "Only Virtual", visibleWhen: onlyAt([GA, VIRTUAL]) },
        { value: "Full-School Program", label: "Full-School Program", visibleWhen: onlyAt([VIRTUAL]) },
        { value: "Tutoring", label: "Tutoring", visibleWhen: onlyAt([VIRTUAL]) },
        { value: "Full High School Experience", label: "Full High School Experience", visibleWhen: onlyAt([HS]) },
        { value: "Tutoring - HS Life Lab", label: "Tutoring - HS Life Lab", visibleWhen: onlyAt([HS]) },
      ],
    },
  ],
};

function submit(schoolId: string, programs: string[]) {
  return validateInterestSubmission({
    definition,
    values: { school_id: schoolId, programs },
    schoolIds: new Set([GA, HS, VIRTUAL]),
    programCodesForSchool: new Set(INTEREST_FORM_PROGRAM_OPTIONS.map((o) => o.value)),
    claimedFormVersionId: null,
    publishedFormVersionId: null,
  });
}

describe("the campus decides which programs it offers", () => {
  it("lets Georgia ask for the three it runs", () => {
    expect(submit(GA, ["In-Person", "Only Virtual"]).ok).toBe(true);
  });

  /**
   * THE ONE THAT MATTERS. Before 28 September the server read the raw option
   * list and ignored each option's visibility, so a posted form could record
   * interest in a programme the campus does not run - and the page would never
   * have shown the box.
   */
  it("refuses Tutoring posted against Georgia, even though the option exists", () => {
    const result = submit(GA, ["Tutoring"]);
    expect(result.ok).toBe(false);
  });

  it("refuses Full-School Program posted against Georgia", () => {
    expect(submit(GA, ["Full-School Program"]).ok).toBe(false);
  });

  it("lets Virtual ask for Full-School Program and Tutoring", () => {
    expect(submit(VIRTUAL, ["Full-School Program", "Tutoring"]).ok).toBe(true);
  });

  it("gives the high school its own list and refuses the network's", () => {
    expect(submit(HS, ["Full High School Experience", "Tutoring - HS Life Lab"]).ok).toBe(true);
    expect(submit(HS, ["In-Person"]).ok).toBe(false);
    expect(submit(GA, ["Full High School Experience"]).ok).toBe(false);
  });

  it("accepts any number of boxes, including none", () => {
    expect(submit(HS, []).ok).toBe(true);
    expect(
      submit(HS, ["Full High School Experience", "Tutoring - HS Life Lab"]).ok
    ).toBe(true);
  });
});

describe("changing campus does not leave a stale tick behind", () => {
  /**
   * A family ticks Tutoring at Virtual, then switches to Georgia. Without
   * program_selector in the pruner the hidden answer survived and the parent
   * met "Select a valid program type." against a checkbox no longer on screen.
   */
  it("drops a selection the new campus does not offer", () => {
    const pruned = pruneAnswersForHiddenOptions(definition, {
      school_id: GA,
      programs: ["In-Person", "Tutoring"],
    });
    expect(pruned.programs).toEqual(["In-Person"]);
  });

  it("leaves a selection the new campus does offer", () => {
    const pruned = pruneAnswersForHiddenOptions(definition, {
      school_id: VIRTUAL,
      programs: ["Full-School Program"],
    });
    expect(pruned.programs).toEqual(["Full-School Program"]);
  });

  it("empties the list when nothing survives the switch", () => {
    const pruned = pruneAnswersForHiddenOptions(definition, {
      school_id: GA,
      programs: ["Full High School Experience"],
    });
    expect(pruned.programs).toEqual([]);
  });
});

describe("the catalog the migration builds from", () => {
  it("still recognises every value recorded on a lead before today", () => {
    for (const legacy of ["In-Person", "Only Virtual", "Hybrid (in-person + virtual)", "Full-School Program", "Tutoring"]) {
      expect(isInterestFormProgramValue(legacy)).toBe(true);
    }
  });

  it("recognises all six of the high school's", () => {
    for (const hs of CAMPUS_PROGRAM_OPTIONS["the academy hs"]) {
      expect(isInterestFormProgramValue(hs)).toBe(true);
    }
    expect(CAMPUS_PROGRAM_OPTIONS["the academy hs"]).toHaveLength(6);
  });

  it("gives Virtual exactly the two Jimmy named, and nothing a virtual school cannot run", () => {
    expect(CAMPUS_PROGRAM_OPTIONS["the academy virtual"]).toEqual([
      "Full-School Program",
      "Tutoring",
    ]);
  });

  it("gives Georgia and Florida the same three, with neither Virtual-only choice", () => {
    for (const campus of ["the academy ga", "the academy fl"]) {
      const offered = CAMPUS_PROGRAM_OPTIONS[campus];
      expect(offered).toHaveLength(3);
      expect(offered).not.toContain("Full-School Program");
      expect(offered).not.toContain("Tutoring");
    }
  });

  it("names only campuses that every option in the union can be traced to", () => {
    const claimed = new Set(Object.values(CAMPUS_PROGRAM_OPTIONS).flat());
    for (const value of claimed) {
      expect(isInterestFormProgramValue(value)).toBe(true);
    }
  });
});
