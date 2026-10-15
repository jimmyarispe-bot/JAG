import { describe, it, expect } from "vitest";
import { BUTTON_LABELS, renderLetterHtml } from "@/lib/admissions/communications/letter-html";

/**
 * WHAT A SCHOOL LEADER ACTUALLY SEES after migration 557.
 *
 * The ladder has its own test. This one is about the thing the ladder cannot
 * check: that the button reaches her inbox at all, reading her own words and
 * pointing at the real token.
 *
 * It is worth its own file because the stored row proves nothing. The body
 * kept in admissions_communications is the TEXT body with the merge fields
 * resolved - a bare URL, no label - so reading it back after a send shows the
 * link and not the button. The label is applied by renderLetterHtml when the
 * HTML is built, which is the only place the question can be answered.
 */

/* Both bodies exactly as 557 and 558 left them, read back from
   admissions_communication_templates on 15 October, \r\n and all. */
const DECISION_GATE =
  "{{student_name}} is waiting on your decision.\r\n\r\n" +
  "Open JAG to review the family's information and answer:\r\n{{decisions_link}}\r\n\r\n" +
  "The answer is recorded against your name, so please do not forward this email for someone else to action.\r\n\r\n{{skip_stage_link}}";

const INQUIRY_ALERT =
  '<p><strong>{{student_name}}</strong> — new inquiry at {{school_name}}.</p>' +
  '<p>Parent: {{parent_name}}</p>' +
  '<p><a href="{{interest_link_action}}">Send schedule interest meeting/conversation link</a></p>' +
  '<p><a href="{{skip_stage_link}}">Skip next stage</a></p>';

const ctx = {
  leadId: "de00679d-33b1-4b11-a58e-c10f06e97810",
  studentName: "test 8:38 first name",
  schoolName: "XXXXXXXX Test Campus",
  parentName: "Jimmy Arispe",
  skipStageToken: "8dfa2cd104df16797fdc438837bb0f06afe8b397a06b54f1b8dae95474670a21",
  interestLinkToken: "a".repeat(64),
} as never;

describe("the skip button in the letter", () => {
  it("renders on the decision gate letter, pointing at the real token", () => {
    const html = renderLetterHtml({ rawBody: DECISION_GATE, subject: "Decision needed", ctx });
    expect(html).toContain("Skip next stage");
    expect(html).toContain(
      "/skip-stage/8dfa2cd104df16797fdc438837bb0f06afe8b397a06b54f1b8dae95474670a21"
    );
    /* No literal braces mailed to a human - migration 294's failure, and the
       reason MERGE_FIELDS is a closed list. */
    expect(html).not.toContain("{{");
    expect(html).not.toContain("Open this link");

    /*
     * THE FALLBACK IS CHECKED ON THE SKIP BUTTON'S OWN HREF, not by looking
     * for the case page anywhere in the letter. A first version of this line
     * failed on exactly that: {{decisions_link}} legitimately resolves to
     * /dashboard/admissions/cases/<id>?section=decisions, so "the case page
     * is absent" is false in a letter where nothing is wrong at all.
     */
    const href = html.slice(0, html.indexOf("Skip next stage")).lastIndexOf('href="');
    expect(html.slice(href, href + 100)).toContain("/skip-stage/");
  });

  it("is a button, not a bare underlined link", () => {
    const html = renderLetterHtml({ rawBody: DECISION_GATE, subject: "Decision needed", ctx });
    const at = html.indexOf("Skip next stage");
    expect(html.slice(Math.max(0, at - 400), at)).toContain("<a ");
  });

  it("is ADDED to the inquiry notice, which keeps the button it already had", () => {
    /* Jimmy: "this is in addition to whatever button/decision is already
       there." Two buttons, and the first one untouched. */
    const html = renderLetterHtml({ rawBody: INQUIRY_ALERT, subject: "New inquiry", ctx });
    expect(html).toContain("Send schedule interest meeting/conversation link");
    expect(html).toContain("Skip next stage");
    expect(html).toContain("/send-interest-link/");
    expect(html).toContain("/skip-stage/");
    expect(html).not.toContain("{{");
  });

  /*
   * FOUND BY THIS FILE ON 15 OCTOBER, AND FIXED THE SAME EVENING.
   *
   * Jimmy asked that morning for "send the link to - send schedule interest
   * meeting/conversation link". BUTTON_LABELS.interest_link_action was set to
   * exactly that and shipped in 3c908c8e, AND IT NEVER REACHED HIM: this
   * letter wraps the merge field in its own anchor, and letter-html keeps an
   * author's anchor text on purpose - "a link somebody wrote an anchor around
   * is a decision".
   *
   * The label was right in the code and wrong in the inbox, and only the
   * letter could fix the letter. Migration 558 changed the anchor text. This
   * expectation is the one that was inverted when it did, and it stays as the
   * guard: the words a school leader reads and the words in BUTTON_LABELS now
   * agree, and must keep agreeing.
   *
   * Deleting the anchor instead, to let the label apply, was the first idea
   * and the wrong one. For an HTML body the buttons are made by
   * buttonsForSoleAnchorParagraphs, which promotes a paragraph whose only
   * content is an ANCHOR - a bare merge field would have produced a naked URL
   * where a button has been since September.
   */
  it("reads the words Jimmy asked for, in the letter and in BUTTON_LABELS", () => {
    const html = renderLetterHtml({ rawBody: INQUIRY_ALERT, subject: "New inquiry", ctx });
    expect(html).toContain("Send schedule interest meeting/conversation link");
    expect(html).not.toContain("Send them the interest meeting link");
    expect(BUTTON_LABELS.interest_link_action).toBe(
      "Send schedule interest meeting/conversation link"
    );
  });
});
