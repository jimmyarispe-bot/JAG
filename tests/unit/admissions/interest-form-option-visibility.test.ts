import { describe, expect, it } from "vitest";
import {
  pruneAnswersForHiddenOptions,
  resolveStaticOptions,
} from "@/lib/admissions/interest-form/definition";
import type {
  InterestFormDefinition,
  InterestQuestionDefinition,
} from "@/lib/admissions/interest-form/types";

/*
 * The case this exists for, in Jimmy's words on 27 September: a Georgia
 * resident taking Virtual or HS classes may use GA Special Needs, but GA GOAL
 * and Academy-Based "should not be available to them".
 */
const GA = "school-ga";
const VIRTUAL = "school-virtual";

const scholarships: InterestQuestionDefinition = {
  key: "ga_scholarships",
  type: "multiselect",
  label: "I am applying for / using the following scholarships",
  required: true,
  order: 1,
  options: [
    {
      value: "ga_goal",
      label: "GA GOAL",
      visibleWhen: { all: [{ path: "school_id", op: "eq", value: GA }] },
    },
    {
      value: "academy_based",
      label: "Academy-Based",
      visibleWhen: { all: [{ path: "school_id", op: "eq", value: GA }] },
    },
    { value: "ga_special_needs", label: "GA Special Needs" },
  ],
};

const definition: InterestFormDefinition = {
  schemaVersion: "interest_form.v1",
  title: "Express Interest",
  sections: [{ key: "ga", title: "Georgia", order: 1, questionKeys: ["ga_scholarships"] }],
  questions: [scholarships],
};

describe("a choice can have its own rule", () => {
  it("offers all three to a family at the Georgia campus", () => {
    const offered = resolveStaticOptions(scholarships, { school_id: GA }).map((o) => o.value);
    expect(offered).toEqual(["ga_goal", "academy_based", "ga_special_needs"]);
  });

  it("offers only Special Needs to a Georgia family taking Virtual", () => {
    const offered = resolveStaticOptions(scholarships, { school_id: VIRTUAL }).map((o) => o.value);
    expect(offered).toEqual(["ga_special_needs"]);
  });

  /* Describing the form is not filling it in. The admin screen and any report
     on what the form asks want every choice, rules and all. */
  it("returns every choice when no answers are supplied", () => {
    expect(resolveStaticOptions(scholarships).map((o) => o.value)).toEqual([
      "ga_goal",
      "academy_based",
      "ga_special_needs",
    ]);
  });

  it("leaves an option with no rule alone", () => {
    const plain: InterestQuestionDefinition = {
      ...scholarships,
      options: [{ value: "a", label: "A" }, { value: "b", label: "B" }],
    };
    expect(resolveStaticOptions(plain, {}).map((o) => o.value)).toEqual(["a", "b"]);
  });
});

describe("an answer naming a withdrawn choice is dropped", () => {
  it("drops GA GOAL when the family moves to Virtual", () => {
    const before = { school_id: VIRTUAL, ga_scholarships: ["ga_goal", "ga_special_needs"] };
    const after = pruneAnswersForHiddenOptions(definition, before);
    expect(after.ga_scholarships).toEqual(["ga_special_needs"]);
  });

  it("keeps everything when the family is at the Georgia campus", () => {
    const before = { school_id: GA, ga_scholarships: ["ga_goal", "ga_special_needs"] };
    expect(pruneAnswersForHiddenOptions(definition, before)).toBe(before);
  });

  it("empties a single-choice answer whose option was withdrawn", () => {
    const single: InterestFormDefinition = {
      ...definition,
      questions: [{ ...scholarships, type: "select" }],
    };
    const after = pruneAnswersForHiddenOptions(single, {
      school_id: VIRTUAL,
      ga_scholarships: "ga_goal",
    });
    expect(after.ga_scholarships).toBe("");
  });

  /* The same object back when nothing changed, so React state does not churn
     on every keystroke in an unrelated field. */
  it("returns the very same object when there is nothing to prune", () => {
    const values = { school_id: GA };
    expect(pruneAnswersForHiddenOptions(definition, values)).toBe(values);
  });

  it("ignores questions that are not choices", () => {
    const withText: InterestFormDefinition = {
      ...definition,
      questions: [
        scholarships,
        { key: "note", type: "text", label: "Note", required: false, order: 2 },
      ],
    };
    const after = pruneAnswersForHiddenOptions(withText, {
      school_id: VIRTUAL,
      note: "ga_goal",
    });
    expect(after.note).toBe("ga_goal");
  });
});
