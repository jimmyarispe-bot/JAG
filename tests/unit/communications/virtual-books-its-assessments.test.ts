/**
 * THE TWO ASSESSMENT LINKS REACH THE PARENT AS BUTTONS.
 *
 * Jimmy, 16 October 2026, gave the sentence, then saw it rendered and said
 * "this visual is exactly what we need in the email". Migration 561 is that
 * letter: a Virtual-only row of application_submitted_email.
 *
 * ── WHY A RENDER TEST AND NOT A ROW TEST ────────────────────────────────────
 *
 * The migration's own guards already check the row. They cannot check the one
 * thing that matters, which is what a parent sees: these two links are NOT
 * merge fields, so BUTTON_LABELS has no entry for either and nothing in the
 * code names them. They become buttons only because letter-html promotes a
 * paragraph whose sole content is an anchor and uses THE ANCHOR'S OWN WORDS.
 * If that rule ever changes, the row stays perfectly valid and the parent gets
 * two bare URLs in a letter telling them to click two buttons.
 *
 * The body below is read back from the database after 561 ran, not retyped
 * from the migration - the same reason the skip-button test reads its bodies
 * back rather than trusting the file that wrote them.
 */

import { describe, it, expect } from "vitest";
import { renderLetterHtml } from "@/lib/admissions/communications/letter-html";

const MATH =
  "https://calendar.google.com/calendar/u/0/appointments/schedules/" +
  "AcZssZ3Mi_h1zyHtNu7qiXZxiQTHTjRBwGPhhIj6gfCO6O7uoguaEJzvvf7atar7Gz5gvbKAvfBh9Cvg";
const LITERACY =
  "https://calendar.google.com/calendar/u/0/appointments/schedules/" +
  "AcZssZ2gIPykl7DWmwk0ywB7L3a5N25i2wmKsFzt76jpI0vqub_qXmkip8zOsn2Sxbti7Ot90jDjAkHT";

/* Read back from admissions_communication_templates on 16 October 2026. */
const VIRTUAL_BODY =
  "<p>Dear {{guardian_first_name}},</p>" +
  "<p>Thank you for submitting {{student_first_name}}'s application for admission to our school.</p>" +
  "<p><strong>The next step in the process is to click on the 2 links below to schedule " +
  "{{student_first_name}}'s Math and Structure Literacy Assessments. After these have been " +
  "completed, Heather will reach out to you with next steps.</strong></p>" +
  `<p><a href="${MATH}">Schedule Math Assessment w/ Ms. Raven</a></p>` +
  `<p><a href="${LITERACY}">Schedule Structured Literacy Assessment w/ Ms. Holly</a></p>` +
  "<p>If you have questions at any point, reply to this email and it will reach me directly.</p>" +
  "<p>Warm regards,<br>{{admissions_contact_name}}<br>{{school_name}} Admissions</p>";

const ctx = {
  guardianFirstName: "Adaeze",
  studentFirstName: "Marcus",
  schoolName: "The Academy Virtual",
  admissionsContactName: "Heather Badger-Brown",
} as never;

const html = () =>
  renderLetterHtml({
    rawBody: VIRTUAL_BODY,
    subject: "Marcus's application to The Academy Virtual received",
    ctx,
  });

describe("the application confirmation at Virtual", () => {
  it("carries Jimmy's sentence word for word", () => {
    /* A PLAIN APOSTROPHE, NOT &#39;. renderHtmlTemplate escapes the VALUE a
       merge field resolves to; the apostrophe in "{{student_first_name}}'s" is
       literal text the author wrote and passes through untouched. The first
       version of this assertion guessed &#39; and failed - the render was
       right and the expectation was wrong. */
    expect(html()).toContain(
      "The next step in the process is to click on the 2 links below to schedule " +
        "Marcus's Math and Structure Literacy Assessments. After these have been " +
        "completed, Heather will reach out to you with next steps."
    );
  });

  it.each([
    ["Math", "Schedule Math Assessment w/ Ms. Raven", MATH],
    ["Structured Literacy", "Schedule Structured Literacy Assessment w/ Ms. Holly", LITERACY],
  ])("renders the %s link as a button with his label", (_name, label, url) => {
    const out = html();
    expect(out).toContain(label);
    expect(out).toContain(url);
    /* A BUTTON, not a bare link. buttonBlockRaw wraps it in a table cell with
       a background; a plain anchor has neither. */
    const at = out.indexOf(label);
    expect(out.slice(Math.max(0, at - 320), at)).toContain("border-radius:8px;background:");
  });

  it("says nothing about there being nothing to do", () => {
    /* The network row still tells GA and FL "There is nothing else for you to
       do in the meantime", which is the opposite of two links to click. That
       sentence must never arrive at Virtual. */
    const out = html();
    expect(out).not.toContain("nothing else for you to do");
    expect(out).not.toContain("scheduling your Shadow Days");
  });

  it("mails no literal braces to a parent", () => {
    expect(html()).not.toContain("{{");
  });
});
