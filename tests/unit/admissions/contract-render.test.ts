import { describe, expect, it } from "vitest";

import {
  escapeHtml,
  longDate,
  placeholdersIn,
  renderContractTemplate,
  renderDerivation,
  renderScheduleTable,
  unfillablePlaceholders,
  type ContractFields,
} from "@/lib/admissions/contract/render";

/**
 * A contract carries figures a family is held to. The failures that matter
 * here are not crashes - they are documents that look finished and are not.
 *
 * Every test below is a version of one question: can a contract reach a family
 * with something missing, wrong, or unresolved in it?
 */

const ANDREW: ContractFields = {
  student_name: "Andrew Ribeiro",
  student_birthdate: "2014-03-08",
  student_grade: "6th Grade",
  school_year: "2026-2027",
  guardian_1_name: "Maria Ribeiro",
  guardian_2_name: null,
  school_name: "The Academy GA",
  school_legal_name: "The Academy GA, LLC. dba The Academy",
  school_signatory: "Jimmy Arispe, CEO/Founder of The Academy GA, LLC.",
  annual_tuition: 19_950,
  prorated_tuition: 13_300,
  proration_label: "8 of 12 months",
  billing_basis: 13_300,
  scholarship_total: 8_000,
  remaining_due: 5_300,
  monthly_amount: null,
  tuition_insurance_cost: 498.75,
  instalments: [
    { label: "Due Upon Signing Contract", dueDate: null, amount: 662.5 },
    { label: "Due October 25, 2026", dueDate: "2026-10-25", amount: 662.5 },
    { label: "Due November 25, 2026", dueDate: "2026-11-25", amount: 662.5 },
    { label: "Due December 25, 2026", dueDate: "2026-12-25", amount: 662.5 },
    { label: "Due January 25, 2027", dueDate: "2027-01-25", amount: 662.5 },
    { label: "Due February 25, 2027", dueDate: "2027-02-25", amount: 662.5 },
    { label: "Due March 25, 2027", dueDate: "2027-03-25", amount: 662.5 },
    { label: "Due April 25, 2027", dueDate: "2027-04-25", amount: 662.5 },
  ],
};

const opts = { templateKey: "tuition_and_payment" };

describe("nothing unresolved reaches a family", () => {
  it("refuses a placeholder it cannot fill, and names it", () => {
    expect(() =>
      renderContractTemplate("<p>Dear {{studnet_name}},</p>", ANDREW, opts)
    ).toThrow(/studnet_name/);
  });

  it("names the template in the error, so a bad one can be found", () => {
    expect(() =>
      renderContractTemplate("<p>{{not_a_field}}</p>", ANDREW, { templateKey: "scholarships" })
    ).toThrow(/scholarships/);
  });

  it("refuses a required field the plan has no value for", () => {
    const noName = { ...ANDREW, student_name: "" };
    expect(() => renderContractTemplate("<p>{{student_name}}</p>", noName, opts)).toThrow(
      /student_name/
    );
  });

  it("does not leave the placeholder text in the document when it fails", () => {
    // The failure mode this prevents: a contract reading "you owe {{remaining_due}}".
    let output = "never assigned";
    try {
      output = renderContractTemplate("<p>{{nonsense}}</p>", ANDREW, opts);
    } catch {
      // expected
    }
    expect(output).toBe("never assigned");
  });

  it("renders an absent second guardian as blank rather than refusing", () => {
    const html = renderContractTemplate(
      "<p>Guardian 2: {{guardian_2_name}}</p>",
      ANDREW,
      opts
    );
    expect(html).toBe("<p>Guardian 2: </p>");
  });

  it("leaves a template with no placeholders exactly as it was", () => {
    const body = "<p>I acknowledge FERPA rights and consent as applicable.</p>";
    expect(renderContractTemplate(body, ANDREW, opts)).toBe(body);
  });
});

describe("the figures themselves", () => {
  it("puts the real money in, formatted as a family reads it", () => {
    const html = renderContractTemplate(
      "<p>{{student_name}} owes {{remaining_due}} of {{annual_tuition}}.</p>",
      ANDREW,
      opts
    );
    expect(html).toBe("<p>Andrew Ribeiro owes $5,300.00 of $19,950.00.</p>");
  });

  it("renders a legitimate zero, because zero is a decided figure", () => {
    const fullyFunded = { ...ANDREW, scholarship_total: 19_950, remaining_due: 0 };
    const html = renderContractTemplate("<p>{{remaining_due}}</p>", fullyFunded, opts);
    expect(html).toBe("<p>$0.00</p>");
  });

  it("tolerates whitespace and case inside the braces", () => {
    expect(renderContractTemplate("<p>{{  Student_Name  }}</p>", ANDREW, opts)).toBe(
      "<p>Andrew Ribeiro</p>"
    );
  });
});

describe("the schedule on the face of the contract", () => {
  it("lists every instalment and totals them", () => {
    const table = renderScheduleTable(ANDREW.instalments);
    expect(table).toContain("Due Upon Signing Contract");
    expect(table).toContain("Upon signing");
    expect(table).toContain("25 October 2026");
    expect(table).toContain("$662.50");
    // Eight payments of $662.50 is exactly what the family owes.
    expect(table).toContain("$5,300.00");
  });

  it("refuses to render a schedule with no rows", () => {
    expect(() => renderScheduleTable([])).toThrow(/no instalments/);
  });

  it("keeps a zero-amount month rather than making the year look shorter", () => {
    const table = renderScheduleTable([
      { label: "Due August 25, 2026", dueDate: "2026-08-25", amount: 0 },
      { label: "Due September 25, 2026", dueDate: "2026-09-25", amount: 500 },
    ]);
    expect(table).toContain("Due August 25, 2026");
    expect(table).toContain("$0.00");
  });
});

describe("the derivation, so a family can check the figure", () => {
  it("shows published, prorated, scholarships and what is left", () => {
    const html = renderDerivation(ANDREW);
    expect(html).toContain("$19,950.00");
    expect(html).toContain("8 of 12 months");
    expect(html).toContain("$13,300.00");
    expect(html).toContain("$8,000.00");
    expect(html).toContain("$5,300.00");
  });

  it("leaves the proration line out entirely when there is none", () => {
    const fullYear = { ...ANDREW, prorated_tuition: null, proration_label: null };
    const html = renderDerivation(fullYear);
    expect(html).not.toContain("Prorated");
  });

  it("leaves the scholarship line out when there is no scholarship", () => {
    const noAward = { ...ANDREW, scholarship_total: 0, remaining_due: 13_300 };
    expect(renderDerivation(noAward)).not.toContain("Less scholarships");
  });
});

describe("a name is text, not markup", () => {
  it("escapes a name that would otherwise break the document", () => {
    const awkward = { ...ANDREW, student_name: 'Tom & Jerry <script>alert("x")</script>' };
    const html = renderContractTemplate("<p>{{student_name}}</p>", awkward, opts);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&amp;");
    expect(html).toContain("&lt;script&gt;");
  });

  it("escapes an apostrophe without mangling the name", () => {
    expect(escapeHtml("O'Brien")).toBe("O&#39;Brien");
  });
});

describe("checking a template before anyone signs it", () => {
  it("lists the placeholders a template uses", () => {
    expect(
      placeholdersIn("<p>{{student_name}} {{remaining_due}} {{student_name}}</p>")
    ).toEqual(["remaining_due", "student_name"]);
  });

  it("finds nothing wrong with a template that only uses real fields", () => {
    expect(
      unfillablePlaceholders("<p>{{student_name}} owes {{remaining_due}}</p>")
    ).toEqual([]);
  });

  it("accepts the two generated blocks as fillable", () => {
    expect(
      unfillablePlaceholders("<div>{{tuition_derivation}}{{schedule_of_payments}}</div>")
    ).toEqual([]);
  });

  it("reports a typo so it is caught when the template is written", () => {
    expect(unfillablePlaceholders("<p>{{anual_tuition}}</p>")).toEqual(["anual_tuition"]);
  });
});

describe("dates a parent can read", () => {
  it("writes an ISO date out in full", () => {
    expect(longDate("2026-10-25")).toBe("25 October 2026");
  });

  it("does not drift a day the way new Date() would", () => {
    // new Date("2026-01-01") is midnight UTC, which is 31 December west of
    // Greenwich. Parsed as text, the first of January stays the first.
    expect(longDate("2026-01-01")).toBe("1 January 2026");
  });

  it("leaves something that is not a date alone rather than inventing one", () => {
    expect(longDate("upon signing")).toBe("upon signing");
  });
});
