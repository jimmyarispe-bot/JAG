import { describe, expect, it } from "vitest";
import {
  applyTextEdits,
  onlyTextChanged,
  type TextEdits,
} from "@/lib/admissions/interest-form/text-edits";
import type { InterestFormDefinition } from "@/lib/admissions/interest-form/types";

const base: InterestFormDefinition = {
  schemaVersion: "interest_form.v1",
  title: "Express Interest",
  sections: [
    {
      key: "student",
      title: "Student Information",
      description: "Tell us about the student you would like to enroll.",
      order: 1,
      questionKeys: ["first_name", "race"],
    },
    {
      key: "funding",
      title: "Funding",
      order: 2,
      questionKeys: [],
      visibleWhen: { all: [{ path: "school_id", op: "eq", value: "ga" }] },
    },
  ],
  questions: [
    {
      key: "first_name",
      type: "text",
      label: "First Name",
      required: true,
      order: 1,
      helpText: "As it appears on the birth certificate.",
    },
    {
      key: "race",
      type: "multiselect",
      label: "Select one or more races that apply to the student.",
      required: false,
      order: 2,
      options: [
        { value: "black", label: "Black or African American" },
        { value: "white", label: "White" },
      ],
    },
  ],
};

describe("changing the words", () => {
  it("changes a question label and nothing else", () => {
    const next = applyTextEdits(base, {
      questions: { first_name: { label: "Student's first name" } },
    });
    expect(next.questions[0].label).toBe("Student's first name");
    expect(onlyTextChanged(base, next)).toEqual([]);
  });

  it("changes a section title and description", () => {
    const next = applyTextEdits(base, {
      sections: { student: { title: "About the student", description: "Just the basics." } },
    });
    expect(next.sections[0].title).toBe("About the student");
    expect(next.sections[0].description).toBe("Just the basics.");
    expect(onlyTextChanged(base, next)).toEqual([]);
  });

  /* Clearing a sentence is a real intention and must be possible. */
  it("removes help text when it is emptied", () => {
    const next = applyTextEdits(base, { questions: { first_name: { helpText: "" } } });
    expect(next.questions[0].helpText).toBeUndefined();
    expect(onlyTextChanged(base, next)).toEqual([]);
  });

  /* But a question with no label cannot be asked, so a label cannot be lost. */
  it("refuses to empty a label, keeping the old one", () => {
    const next = applyTextEdits(base, { questions: { first_name: { label: "   " } } });
    expect(next.questions[0].label).toBe("First Name");
  });

  it("trims what a person typed", () => {
    const next = applyTextEdits(base, { questions: { first_name: { label: "  Given name  " } } });
    expect(next.questions[0].label).toBe("Given name");
  });

  it("relabels an option without touching its value", () => {
    const next = applyTextEdits(base, {
      questions: { race: { optionLabels: { black: "Black / African American" } } },
    });
    const race = next.questions[1];
    expect(race.options?.[0]).toEqual({ value: "black", label: "Black / African American" });
    expect(race.options?.[1]).toEqual({ value: "white", label: "White" });
    expect(onlyTextChanged(base, next)).toEqual([]);
  });

  it("leaves a question alone when no edit names it", () => {
    const next = applyTextEdits(base, { questions: { first_name: { label: "Given name" } } });
    expect(next.questions[1]).toEqual(base.questions[1]);
  });

  it("keeps a campus visibility rule exactly as it was", () => {
    const next = applyTextEdits(base, { sections: { funding: { title: "Scholarships" } } });
    expect(next.sections[1].visibleWhen).toEqual(base.sections[1].visibleWhen);
    expect(onlyTextChanged(base, next)).toEqual([]);
  });

  it("changes the form's own title", () => {
    const next = applyTextEdits(base, { formTitle: "Tell us about your child" });
    expect(next.title).toBe("Tell us about your child");
    expect(onlyTextChanged(base, next)).toEqual([]);
  });

  it("does nothing at all when handed no edits", () => {
    const next = applyTextEdits(base, {} as TextEdits);
    expect(next).toEqual(base);
    expect(onlyTextChanged(base, next)).toEqual([]);
  });
});

describe("the guard that catches what the editor must never do", () => {
  it("names a renamed key, because every stored answer hangs off it", () => {
    const tampered: InterestFormDefinition = {
      ...base,
      questions: [{ ...base.questions[0], key: "given_name" }, base.questions[1]],
    };
    expect(onlyTextChanged(base, tampered)).toContain("the questions, or their order, changed");
  });

  it("names a changed option value, not just its wording", () => {
    const tampered: InterestFormDefinition = {
      ...base,
      questions: [
        base.questions[0],
        {
          ...base.questions[1],
          options: [
            { value: "black_or_african_american", label: "Black or African American" },
            { value: "white", label: "White" },
          ],
        },
      ],
    };
    expect(onlyTextChanged(base, tampered)).toContain(
      "race has different answer values, not just different wording"
    );
  });

  it("names a question that became required", () => {
    const tampered: InterestFormDefinition = {
      ...base,
      questions: [base.questions[0], { ...base.questions[1], required: true }],
    };
    expect(onlyTextChanged(base, tampered)).toContain("race changed whether it is required");
  });

  it("names a changed type", () => {
    const tampered: InterestFormDefinition = {
      ...base,
      questions: [{ ...base.questions[0], type: "email" }, base.questions[1]],
    };
    expect(onlyTextChanged(base, tampered)).toContain("first_name changed type");
  });

  it("names a changed campus rule", () => {
    const tampered: InterestFormDefinition = {
      ...base,
      sections: [
        base.sections[0],
        {
          ...base.sections[1],
          visibleWhen: { all: [{ path: "school_id", op: "eq", value: "fl" }] },
        },
      ],
    };
    expect(onlyTextChanged(base, tampered)).toContain(
      "section funding is shown under different conditions"
    );
  });

  it("names a section that lost a question", () => {
    const tampered: InterestFormDefinition = {
      ...base,
      sections: [{ ...base.sections[0], questionKeys: ["first_name"] }, base.sections[1]],
    };
    expect(onlyTextChanged(base, tampered)).toContain("section student holds different questions");
  });
});
