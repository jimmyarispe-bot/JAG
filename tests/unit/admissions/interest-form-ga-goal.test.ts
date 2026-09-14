import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Versions 18 and 19 of the inquiry form — the GA GOAL ask.
 *
 * 19 is a one-line follow-up to 18: the pledge's label is emptied, because the
 * signature field renders the label as a paragraph on top of its own bolded
 * "Signature *" heading, and v18 left the label reading "Signature".
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
    "supabase/migrations/353_interest_form_v19_pledge_label_2026_09_14.sql"
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
});
