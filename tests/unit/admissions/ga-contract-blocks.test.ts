import { describe, expect, it } from "vitest";

import { GA_CONTRACT_BLOCKS } from "@/lib/admissions/contract/ga-2026-09-06";
import {
  renderContractTemplate,
  unfillablePlaceholders,
  type ContractFields,
} from "@/lib/admissions/contract/render";

/**
 * The contract text itself, checked against the renderer that will serve it.
 *
 * A typo in a placeholder is not a typo - it is either a contract that refuses
 * to render at the moment a family opens it, or, before this module existed, a
 * contract printing {{anual_tuition}} at a parent. These tests are what stops
 * either reaching anyone.
 *
 * The figures are Andrew Ribeiro's real shape at The Academy GA.
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

function render(templateKey: string): string {
  const block = GA_CONTRACT_BLOCKS.find((b) => b.templateKey === templateKey);
  if (!block) throw new Error(`no block ${templateKey}`);
  return renderContractTemplate(block.bodyHtml, ANDREW, { templateKey });
}

describe("the set of blocks", () => {
  it("is the five Jimmy agreed on, in order", () => {
    expect(GA_CONTRACT_BLOCKS.map((b) => b.templateKey)).toEqual([
      "contract_tuition_and_payment",
      "contract_scholarships",
      "contract_program_and_operations",
      "contract_conduct_and_consents",
      "contract_acknowledgement",
    ]);
    expect(GA_CONTRACT_BLOCKS.map((b) => b.sortOrder)).toEqual([1, 2, 3, 4, 5]);
  });

  it("asks a family to initial every one of them", () => {
    expect(GA_CONTRACT_BLOCKS.every((b) => b.requiresSignature)).toBe(true);
  });

  it("uses no placeholder the renderer cannot fill", () => {
    for (const b of GA_CONTRACT_BLOCKS) {
      expect({ [b.templateKey]: unfillablePlaceholders(b.bodyHtml) }).toEqual({
        [b.templateKey]: [],
      });
    }
  });

  it("renders every block without refusing", () => {
    for (const b of GA_CONTRACT_BLOCKS) {
      expect(() => render(b.templateKey)).not.toThrow();
    }
  });

  it("leaves no unresolved braces anywhere in the contract", () => {
    for (const b of GA_CONTRACT_BLOCKS) {
      expect(render(b.templateKey)).not.toMatch(/\{\{|\}\}/);
    }
  });
});

describe("the figures on the face of the contract", () => {
  const html = () => render("contract_tuition_and_payment");

  it("shows the derivation the family can check", () => {
    const out = html();
    expect(out).toContain("$19,950.00");
    expect(out).toContain("8 of 12 months");
    expect(out).toContain("$13,300.00");
    expect(out).toContain("$8,000.00");
    expect(out).toContain("$5,300.00");
  });

  it("shows the schedule, and it totals what is owed", () => {
    const out = html();
    expect(out).toContain("Due Upon Signing Contract");
    expect(out).toContain("25 April 2027");
    // Eight at $662.50.
    expect(out.match(/\$662\.50/g) ?? []).toHaveLength(8);
  });

  it("no longer asks the family to upload a schedule we produced", () => {
    // The paper contract had them upload a PDF the school had emailed them.
    // Jimmy, 28 September: it renders here instead.
    const out = html();
    expect(out).not.toMatch(/uploaded in this/i);
    expect(out).not.toMatch(/Choose File/i);
    expect(out).toContain("set out below");
  });

  it("states the late fee and the suspension in the same words as the policy", () => {
    const out = html();
    expect(out).toContain("$25 per day");
    expect(out).toContain("five days ($125)");
    // Whitespace-tolerant: the phrase wraps across a line in the source, and
    // whitespace is insignificant in HTML. Asserting the literal string here
    // failed for a reason that has nothing to do with what a family reads.
    expect(out).toMatch(/1st day of\s+the following\s+month/);
    expect(out).toContain("suspended");
  });

  it("tells the family when they will be invoiced, not just when to pay", () => {
    // GA's contract said when to pay and never when it would bill. Added
    // 6 September to match FL.
    expect(html()).toContain("20th of each month");
  });
});

describe("what a family is told about leaving early", () => {
  it("names the full published figure, not the discounted one", () => {
    const out = render("contract_scholarships");
    expect(out).toContain("$19,950.00");
    expect(out).toMatch(/entire remaining portion/i);
    expect(out).toMatch(/withdraw Andrew Ribeiro/i);
  });

  it("does not print the stale 2022 GOAL limits", () => {
    // Georgia statute sets these and the source document still carried a "New
    // Opportunity for 2022" line. Removed rather than printed at a parent in
    // 2026; the section points at GOAL's published figures instead.
    const out = render("contract_scholarships");
    expect(out).not.toContain("2022");
    expect(out).not.toContain("$5,000");
    expect(out).toMatch(/published by GOAL/i);
  });
});

describe("the child is named, never referred to", () => {
  it("uses the name in the clauses that bite", () => {
    expect(render("contract_tuition_and_payment")).toContain(
      "Andrew Ribeiro&rsquo;s attendance will be <strong>suspended</strong>"
    );
    expect(render("contract_conduct_and_consents")).toMatch(
      /suspend, dismiss or expel\s+Andrew Ribeiro/
    );
  });

  it("never falls back to the paper contract's wording", () => {
    for (const b of GA_CONTRACT_BLOCKS) {
      expect(render(b.templateKey)).not.toMatch(/above-named Student/i);
      expect(render(b.templateKey)).not.toMatch(/his\/her|son\/daughter/i);
    }
  });
});

describe("who signs for the school", () => {
  it("takes the signatory from the school record, not from the contract text", () => {
    // 447 baked in "CEO/Founder, {{school_legal_name}}", which is not what GA's
    // contract says and collapses at HS and Virtual, where the signatory acts
    // for the network and for three LLCs respectively. 448 gave schools their
    // own column; 449 pointed the text at it.
    const out = render("contract_acknowledgement");
    expect(out).toContain("Jimmy Arispe, CEO/Founder of The Academy GA, LLC.");
    expect(out).not.toMatch(/CEO\/Founder, /);
  });

  it("still names the contracting entity separately in the opening paragraph", () => {
    // Who a family contracts WITH and who signs FOR the school are two facts.
    expect(render("contract_tuition_and_payment")).toContain(
      "The Academy GA, LLC. dba The Academy"
    );
  });
});

describe("what is deliberately absent", () => {
  it("does not offer tuition insurance, which a family cannot answer here", () => {
    // It is an election, and enrollment_packet_templates captures only
    // initials. An offer with no way to accept or decline it has no business
    // on a contract somebody signs.
    for (const b of GA_CONTRACT_BLOCKS) {
      expect(render(b.templateKey)).not.toMatch(/tuition insurance/i);
    }
  });
});
