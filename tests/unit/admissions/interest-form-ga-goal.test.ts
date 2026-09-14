import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Versions 18, 19 and 20 of the inquiry form — the GA GOAL ask.
 *
 * 19 is a one-line follow-up to 18: the pledge's label is emptied, because the
 * signature field renders the label as a paragraph on top of its own bolded
 * "Signature *" heading, and v18 left the label reading "Signature".
 *
 * 20 rewrites the confirmation a family signs at the end of the eligibility
 * section — the whole application rather than the checkboxes above it, the
 * school verifying rather than GA GOAL, and removal from the school named
 * alongside withdrawal of the scholarship.
 *
 * These read the migration's own definition JSON rather than a copy, so the test
 * cannot drift from what is actually published. Every question key is checked to
 * still resolve, because splitting a section is exactly the change that silently
 * orphans a question: it disappears from the form while its answers stay in the
 * table, and nobody notices until a family's record is missing a field.
 */

const sql = readFileSync(
  join(
    __dirname,
    "..",
    "..",
    "..",
    "supabase/migrations/354_interest_form_v20_confirmation_wording_2026_09_14.sql"
  ),
  "utf8"
);

type Section = {
  key: string;
  title: string;
  description?: string;
  order: number;
  visibleWhen?: unknown;
  questionKeys: string[];
};
type Question = { key: string; label: string; required?: boolean; visibleWhen?: unknown };

function definition(): { sections: Section[]; questions: Question[] } {
  const open = sql.indexOf("definition_text := $json$") + "definition_text := $json$".length;
  const close = sql.indexOf("  $json$;");
  expect(open).toBeGreaterThan(0);
  expect(close).toBeGreaterThan(open);
  return JSON.parse(sql.slice(open, close));
}

const doc = definition();
const sections = Object.fromEntries(doc.sections.map((s) => [s.key, s]));
const questions = Object.fromEntries(doc.questions.map((q) => [q.key, q]));

describe("the GA GOAL fund block", () => {
  it("has the heading Jimmy asked for", () => {
    expect(sections.ga_goal_fund.title).toBe("GA GOAL - Student Scholarship Fund");
  });

  it("carries the rewritten text, in his words", () => {
    const text = sections.ga_goal_fund.description ?? "";
    expect(text).toContain("This means YOU!");
    expect(text).toContain(
      "GA tax payers give their GA tax liabilities to our school instead of the state government"
    );
    expect(text).toContain("Please help by participating in GA GOAL each year.");
    expect(text).toContain("Type your signature below");
  });

  it("keeps the contribution limits exact", () => {
    const text = sections.ga_goal_fund.description ?? "";
    expect(text).toContain("Single filer or head of household can contribute up to $2,500");
    expect(text).toContain("Married filing separately: Up to $2,500");
    expect(text).toContain("Married couple filing jointly: Up to $5,000");
  });

  it("drops the old tax-mechanics wording entirely", () => {
    const text = sections.ga_goal_fund.description ?? "";
    expect(text).not.toContain("I understand GA GOAL student scholarship funds are derived");
  });

  /**
   * v18 left this as "Signature", and the signature field renders the label as
   * a paragraph AND a hard-coded "Signature *" above the input — so the box
   * opened with a quiet unbolded "Signature" above the real one. The section
   * description carries the wording now, so the question needs no label at all.
   */
  it("carries no label of its own, so the box says Signature once", () => {
    expect(questions.ga_goal_taxpayer_pledge.label).toBe("");
  });

  it("still takes a signature, and still requires one", () => {
    expect(sections.ga_goal_fund.questionKeys).toEqual(["ga_goal_taxpayer_pledge"]);
    expect(questions.ga_goal_taxpayer_pledge.required).toBe(true);
  });
});

describe("the confirmation a family signs", () => {
  const label = questions.ga_goal_eligibility_signature.label;

  it("covers the whole application, not just the ticked criteria", () => {
    expect(label).toContain("the application information I have provided above is true");
    expect(label).not.toContain("the eligibility criteria I have ticked above");
  });

  it("says the school verifies, not GA GOAL", () => {
    expect(label).toContain("the school verifies all information");
    expect(label).not.toContain("GA GOAL verifies eligibility");
  });

  /** The consequence that was missing: it is not only the money at stake. */
  it("names removal from the school alongside losing the scholarship", () => {
    expect(label).toContain("my child may be removed from the school");
    expect(label).toContain("scholarship(s) may be withdrawn");
  });

  it("still asks about the genuineness of the documents", () => {
    expect(label).toContain("the documents I have uploaded are genuine");
  });

  it("is still required, and still inside the eligibility section", () => {
    expect(questions.ga_goal_eligibility_signature.required).toBe(true);
    expect(sections.ga_goal.questionKeys).toContain("ga_goal_eligibility_signature");
  });
});

describe("who sees it", () => {
  /**
   * Every GA family, ticked or not — which is what it already did, and what
   * Jimmy confirmed he wanted when asked. The gate is the campus, nothing else.
   */
  it("is gated on the campus and not on the scholarship checkbox", () => {
    const gate = JSON.stringify(sections.ga_goal_fund.visibleWhen);
    expect(gate).toContain("school_id");
    expect(gate).toContain("__SCHOOL_GA__");
    expect(gate).not.toContain("ga_scholarships");
  });

  it("carries exactly the gate the old campus section carried", () => {
    expect(sections.ga_goal_fund.visibleWhen).toEqual(sections.ga_detail.visibleWhen);
  });

  it("does not gate the pledge question a second time", () => {
    // Two gates that can disagree is worse than one that cannot.
    expect("visibleWhen" in questions.ga_goal_taxpayer_pledge).toBe(false);
  });

  /**
   * THE ONE TO LEAVE ALONE. The eligibility section's two uploads are required.
   * Showing it to families who are not applying for GA GOAL would stop anyone
   * without a tax return to hand from submitting the form at all.
   */
  it("leaves the eligibility section gated on ticking GA GOAL", () => {
    const gate = JSON.stringify(sections.ga_goal.visibleWhen);
    expect(gate).toContain("ga_scholarships");
    expect(gate).toContain("ga_goal");
    expect(sections.ga_goal.questionKeys).toContain("ga_goal_income_document");
  });
});

describe("the campus heading is gone", () => {
  it("no longer announces the campus the family already chose", () => {
    expect(sections.ga_detail.title).toBe("");
    expect(sections.ga_detail.description).toBe("");
  });

  /**
   * Against the definition, not the file. The migration's header comment quotes
   * the old wording to explain what it replaced — and asserting on the file
   * caught that comment instead of the content. Third time today; the rule is
   * now written down: assert on what ships, never on the prose about it.
   */
  it("carries the old text nowhere in the published definition", () => {
    const published = JSON.stringify(doc);
    expect(published).not.toContain("A few questions specific to our Georgia campus.");
    expect(published).not.toContain("The Academy GA\",\n");
  });
});

describe("splitting a section orphaned nothing", () => {
  const placed = doc.sections.flatMap((s) => s.questionKeys);

  it("keeps every question the old GA section held, in the same order", () => {
    expect([
      ...sections.ga_detail.questionKeys,
      ...sections.ga_goal_fund.questionKeys,
      ...sections.ga_detail_scholarships.questionKeys,
    ]).toEqual([
      "ga_current_school_name",
      "ga_zoned_public_school",
      "ga_goal_taxpayer_pledge",
      "ga_scholarships",
      "ga_gtid",
      "ga_special_needs_amount",
      "ga_special_needs_award_letter",
      "ga_goal_narrative",
    ]);
  });

  it("puts the ask between the zoned school question and the scholarships", () => {
    expect(sections.ga_detail.order).toBeLessThan(sections.ga_goal_fund.order);
    expect(sections.ga_goal_fund.order).toBeLessThan(sections.ga_detail_scholarships.order);
    expect(sections.ga_detail_scholarships.order).toBeLessThan(sections.ga_goal.order);
  });

  it("leaves no questionKey pointing at a question that does not exist", () => {
    expect(placed.filter((k) => !(k in questions))).toEqual([]);
  });

  it("gives every section a distinct order", () => {
    const orders = doc.sections.map((s) => s.order);
    expect(new Set(orders).size).toBe(orders.length);
  });

  it("changes no question keys, so recorded answers still mean what they meant", () => {
    expect(doc.questions).toHaveLength(59);
  });
});

describe("the renderer can carry a section with no heading", () => {
  const renderer = readFileSync(
    join(__dirname, "..", "..", "..", "src/components/admissions/portal/InterestFormRenderer.tsx"),
    "utf8"
  ).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

  it("omits the heading block when there is neither title nor description", () => {
    expect(renderer).toContain("section.title || section.description ?");
  });

  it("no longer renders an unconditional h2", () => {
    expect(renderer).toMatch(/section\.title \? \(/);
  });

  it("omits a signature's paragraph when the question has no label", () => {
    expect(renderer).toMatch(/question\.label \? \(/);
  });

  /**
   * The grey note under every signature box is gone. By the GA GOAL block the
   * section text already ends "Type your signature below acknowledging that you
   * have read and understand...", so the note repeated the instruction it had
   * just been given, in smaller type.
   */
  it("no longer prints the signature note under every box", () => {
    expect(renderer).not.toContain("is your signature, dated today");
    expect(renderer).not.toContain("sig-note");
  });
});

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * The public form submits an INQUIRY, not an application.
 *
 * Jimmy, 14 September, after walking the live form as a parent would:
 * "this is an interest inquiry. not application."
 *
 * The distinction belongs to the family. This form starts a conversation; the
 * application is the wizard behind the portal, reached after they have an
 * account and a campus. Telling a parent they have "applied" when they have not
 * is wrong on its own — and the thank-you email they receive back calls it an
 * inquiry, so the button and the email were contradicting each other.
 * ─────────────────────────────────────────────────────────────────────────────
 */
describe("the button says what the family is actually doing", () => {
  /*
   * Comments stripped, and it matters here more than usual: the note explaining
   * this change quotes the old label, so a raw read would find "Submit
   * Application" in prose and pass a test that should fail.
   */
  const renderer = readFileSync(
    join(__dirname, "..", "..", "..", "src/components/admissions/portal/InterestFormRenderer.tsx"),
    "utf8"
  ).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

  it("never calls this an application", () => {
    expect(renderer).not.toContain('"Submit Application"');
  });

  /**
   * THE ONE THAT MATTERS. The label lives in two places — the feedback hook and
   * the button itself. A pair like that drifts, and a button that changes its
   * wording halfway through submitting reads as a bug to whoever it happens to.
   */
  it("says Submit Inquiry in both places, not one", () => {
    const hits = renderer.match(/idle: "Submit Inquiry"/g) ?? [];
    expect(hits.length).toBe(2);
  });
});
