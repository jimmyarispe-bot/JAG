import { describe, expect, it } from "vitest";
import { buildMergeValues } from "@/lib/admissions/communications/merge-fields";

/**
 * THE LINK MUST OPEN THE CHILD THE EMAIL NAMES.
 *
 * The gate template (migration 247) reads:
 *
 *   {{student_name}} is waiting on your decision.
 *   Open JAG to review the family's information and answer:
 *   {{decisions_link}}
 *   The answer is recorded against your name, so please do not forward this
 *   email for someone else to action.
 *
 * decisions_link was a bare list URL. So the email named a child, warned that
 * the answer would be attributed to the reader, and then opened a queue whose
 * first row is whoever has been waiting longest.
 *
 * On 15 September 2026 a School Leader opened an email about Julian Oubre Towa
 * and was shown a decision about Trisha Wilkerson - a 3rd grader at a campus
 * that is not hers. Nothing errored. The link worked perfectly and went to the
 * wrong child.
 */

describe("decisions_link", () => {
  it("opens the case of the lead it was rendered for", () => {
    const data = buildMergeValues({ leadId: "e61c7cfb-db9a-48b5-9f96-aefdea3956ac" });
    expect(data.decisions_link).toContain("/dashboard/admissions/cases/e61c7cfb-db9a-48b5-9f96-aefdea3956ac");
    expect(data.decisions_link).toContain("section=decisions");
  });

  /** THE ONE THAT MATTERS: never the bare queue when a child is known. */
  it("never sends a named child's email to the queue", () => {
    const data = buildMergeValues({ leadId: "11111111-2222-3333-4444-555555555555" });
    expect(
      data.decisions_link.endsWith("/dashboard/admissions/decisions"),
      "the email names a child and the link opens whoever has waited longest"
    ).toBe(false);
  });

  /** Without a lead there is no child to name, and a queue is honest. */
  it("falls back to the queue when no lead is in context", () => {
    const data = buildMergeValues({});
    expect(data.decisions_link).toContain("/dashboard/admissions/decisions");
  });

  it("gives two different children two different links", () => {
    const a = buildMergeValues({ leadId: "aaaaaaaa-0000-0000-0000-000000000000" });
    const b = buildMergeValues({ leadId: "bbbbbbbb-0000-0000-0000-000000000000" });
    expect(a.decisions_link).not.toBe(b.decisions_link);
  });
});
