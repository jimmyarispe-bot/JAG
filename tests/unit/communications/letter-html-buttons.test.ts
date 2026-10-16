import { describe, expect, it } from "vitest";
import { BUTTON_LABELS, renderLetterHtml } from "@/lib/admissions/communications/letter-html";
import type { MergeContext } from "@/lib/admissions/communications/merge-fields";

/**
 * EVERY LINK IN EVERY LETTER IS A BUTTON. THIS IS THE FILE THAT SAYS SO.
 *
 * Jimmy, 10 October 2026: "can you create an actual button that will go into
 * these emails with the links tied to them." The commit that answered him was
 * titled "every link in every letter is a button now" and it was not true, in
 * the same place twice.
 *
 * inquiry_staff_alert is the ONE active template written in HTML; the other
 * eighty-four are plain text. On 10 October its markup was escaped and landed
 * in Danni's inbox as view-source. On 12 October, fixed, it landed in the test
 * campus's first staff alert with its call to action as a bare underlined
 * link - because the fix for the first bug deliberately skipped the button.
 *
 * Both times the module had NO TESTS AT ALL, which is why one template could
 * be wrong twice while eighty-four were right. These assertions are built from
 * that exact template's stored body and the exact values from the letter Jimmy
 * screenshotted, so the thing under test is the thing that failed.
 */

/**
 * The stored body of inquiry_staff_alert, verbatim from the live row,
 * RE-READ ON 16 OCTOBER 2026 AND IT HAD DRIFTED TWICE.
 *
 * This constant claimed to be the live row and was two migrations behind it:
 * 557 appended the Skip next stage paragraph, and 558 changed the call to
 * action from "Send them the interest meeting link" to Jimmy's words. The
 * tests all passed the whole time, because a fixture that is wrong is still
 * internally consistent - it just stops being about the letter it names.
 *
 * That is the same shape as the fault this file was written for: the module
 * had no tests while one template was wrong twice. A copy of a letter needs
 * re-reading whenever the letter changes, and the two assertions below that
 * depended on the old copy are now about the real one.
 */
const INQUIRY_STAFF_ALERT_BODY =
  "<p><strong>{{student_name}}</strong> — new inquiry at {{school_name}}.</p>" +
  "<p>Program: {{inquiry_programs}}</p>" +
  "<p>Parent: {{parent_name}}<br>" +
  'Email: <a href="mailto:{{parent_email}}">{{parent_email}}</a><br>' +
  'Phone: <a href="tel:{{parent_phone_dial}}">{{parent_phone}}</a></p>' +
  "<p><strong>This family has not heard from us yet.</strong> " +
  "Nothing is sent until you send it.</p>" +
  '<p><a href="{{interest_link_action}}">Send schedule interest meeting/conversation link</a></p>' +
  '<p><a href="{{skip_stage_link}}">Skip next stage</a></p>';

const CTX: MergeContext = {
  studentFirstName: "test disregard 3:38",
  guardianFirstName: "jimmy",
  guardianLastName: "arispe",
  guardianEmail: "jimmy.arispe@gmail.com",
  guardianPhone: "6782708767",
  schoolName: "XXXXXXXX Test Campus",
  inquiryPrograms: ["Only Virtual"],
  interestLinkToken: "3b7e",
  skipStageToken: "8dfa2cd104df16797fdc438837bb0f06afe8b397a06b54f1b8dae95474670a21",
};

function staffAlert(): string {
  return renderLetterHtml({
    rawBody: INQUIRY_STAFF_ALERT_BODY,
    subject: "New inquiry: test disregard 3:38 — XXXXXXXX Test Campus",
    ctx: CTX,
    schoolName: "XXXXXXXX Test Campus",
  });
}

describe("the one HTML template gets a button too", () => {
  it("turns its call to action into the purple button", () => {
    const html = staffAlert();
    expect(html).toContain("background:#7c3aed");
    expect(html).toContain("color:#ffffff");
    expect(html).toMatch(/>Send schedule interest meeting\/conversation link<\/a>/);
  });

  it("ties the button to the send-interest-link address", () => {
    expect(staffAlert()).toMatch(/href="https?:\/\/[^"]*\/send-interest-link\/3b7e"/);
  });

  it("puts NOTHING underneath the button", () => {
    /*
     * INVERTED 16 OCTOBER 2026. Jimmy: "no paste in your browser".
     *
     * Every button used to carry "Or paste this into your browser:" and the
     * whole URL again in grey underneath. He had already struck every one of
     * them out of the flow document by hand on 15 October; this is the same
     * instruction applied to the letters themselves.
     *
     * The reason it existed was written down and was backwards - "a client
     * that strips tables" - when tables are the standard way to lay out an
     * email PRECISELY BECAUSE Outlook handles them. It was guarding the least
     * likely failure and charging every letter a repeated URL for it. Worst
     * at Virtual, where two Google appointment links put 240 characters of
     * grey URL under the two buttons Jimmy had just approved without them.
     */
    const html = staffAlert();
    expect(html).not.toContain("Or paste this into your browser");
    /* The anchor is INSIDE the table cell, not replaced by it, so a button is
       still a link to anything that can read one. */
    expect(html).toMatch(/<a href="[^"]*\/send-interest-link\/3b7e"/);
  });

  it("builds one button per call to action, not one per anchor", () => {
    /*
     * TWO SINCE MIGRATION 557, and it was one until then. The letter has FOUR
     * anchors: the parent's mailto, the parent's tel, the interest-meeting
     * link and Skip next stage. Only the last two are calls to action; the
     * first two sit inside a sentence and are refused twice over, by the
     * sole-anchor rule and by the http/https check.
     *
     * The number is asserted rather than "at least one" because it is the
     * thing that breaks quietly: a letter gaining a third button nobody meant
     * to add looks fine in every other test here.
     */
    const html = staffAlert();
    expect(html.match(/background:#7c3aed/g)).toHaveLength(2);
    expect(html).toContain("Skip next stage");
  });

  it("leaves the parent's email and phone as links inside their sentence", () => {
    /* A button in the middle of "Email: ..." is not a button. Both are also
       refused by the http/https check, which is the second reason for the
       same answer. */
    const html = staffAlert();
    expect(html).toContain('href="mailto:jimmy.arispe@gmail.com"');
    expect(html).toMatch(/href="tel:/);
  });

  it("never escapes its own markup into view-source", () => {
    /* The 10 October failure. Danni read "<p><strong>" as text. */
    const html = staffAlert();
    expect(html).not.toContain("&lt;p&gt;");
    expect(html).toContain("<strong>test disregard 3:38</strong>");
  });

  it("never leaves an empty href behind", () => {
    /* The quieter half of the 10 October failure: the link-to-button rule
       pulled the merge field out of the anchor and left href="" . */
    expect(staffAlert()).not.toContain('href=""');
  });
});

describe("what does not become a button", () => {
  it("an anchor with words around it stays a link", () => {
    const html = renderLetterHtml({
      rawBody: '<p>Write to <a href="https://example.com/x">us</a> any time.</p>',
      subject: "s",
      ctx: {},
      schoolName: null,
    });
    expect(html).not.toContain("background:#7c3aed");
    expect(html).toContain('href="https://example.com/x"');
  });

  it("a javascript: anchor alone in a paragraph stays text, never a button", () => {
    /* A merge value is data, and a letter that links anywhere a value tells
       it to is a letter that one day carries javascript: to a school leader. */
    const html = renderLetterHtml({
      rawBody: '<p><a href="javascript:alert(1)">Click</a></p>',
      subject: "s",
      ctx: {},
      schoolName: null,
    });
    expect(html).not.toContain("background:#7c3aed");
  });

  it("an anchor with no words gets no button, because a button needs a label", () => {
    const html = renderLetterHtml({
      rawBody: '<p><a href="https://example.com/x"></a></p>',
      subject: "s",
      ctx: {},
      schoolName: null,
    });
    expect(html).not.toContain("background:#7c3aed");
  });
});

describe("the eighty-four plain text letters still work the way they did", () => {
  it("still makes a button from a link on its own line", () => {
    const html = renderLetterHtml({
      rawBody: "Dear {{parent_first_name}},\r\n\r\nHere you go.\r\n\r\n{{scheduling_link}}",
      subject: "s",
      ctx: {
        guardianFirstName: "jimmy",
        schedulingUrl: "https://calendar.app.google/Q1EfhsTx4bjpQKgY9",
      },
      schoolName: "XXXXXXXX Test Campus",
    });
    expect(html).toContain("background:#7c3aed");
    /*
     * THE LABEL COMES FROM THE MAP, NOT FROM A COPY OF IT HERE.
     *
     * This read "Choose your time" and failed the ship on 15 October 2026
     * when Jimmy renamed all four booking buttons - "not choose - schedule
     * your shadow days...". The test exists to prove a link on its own line
     * becomes a BUTTON; the wording on it is the renderer's business and
     * his to change. Pinning the words here made a label rename look like a
     * regression, and a guard that fails a ship on its own weight teaches
     * people to delete guards.
     */
    expect(html).toContain(BUTTON_LABELS.scheduling_link);
  });

  it("does not double-escape an ampersand in a link", () => {
    /* buttonBlockRaw takes values that are already safe. Escaping twice is
       how a URL with an & in it becomes a dead link, which is not a failure
       anybody notices before a parent clicks. */
    const html = renderLetterHtml({
      rawBody: '<p><a href="https://example.com/x?a=1&amp;b=2">Go</a></p>',
      subject: "s",
      ctx: {},
      schoolName: null,
    });
    expect(html).toContain('href="https://example.com/x?a=1&amp;b=2"');
    expect(html).not.toContain("&amp;amp;");
  });
});
