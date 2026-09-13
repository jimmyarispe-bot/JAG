import { describe, expect, it } from "vitest";
import {
  PROSPECT_INVITE_SUBJECT,
  PROSPECT_PORTAL_PATH,
  buildProspectInviteBody,
} from "@/lib/admissions/portal/prospect-invite-email";

/**
 * The letter a prospective parent receives.
 *
 * This is the first thing the JAG ever says to a family, and it went out once as
 * staff onboarding copy — "You've been invited to join The Academy Way", with no
 * mention of the child. These tests hold the wording to what was actually asked
 * for, because a template nobody is testing drifts back towards the default.
 */

const LINK = "https://theacademyway.thejag.org/auth/callback?token_hash=abc&type=invite";

const body = buildProspectInviteBody({
  childName: "Savannah",
  signatory: "Nina Gaddy",
  inviteLink: LINK,
});

describe("the subject line", () => {
  it("is the one that was asked for", () => {
    expect(PROSPECT_INVITE_SUBJECT).toBe("Submit your application - The Academy");
  });
});

describe("what the letter says", () => {
  it("opens by thanking them for the conversation about their child", () => {
    expect(body).toContain(
      "Thank you for spending time with us so we could learn about Savannah's educational needs."
    );
  });

  it("keeps the sentence about GREATNESS, capitalised as written", () => {
    expect(body).toContain("identify their individual GREATNESS.");
  });

  it("names the child every time, not just once", () => {
    // Three mentions: the opening, the strengths-and-challenges sentence, and
    // the review-before-shadow-days sentence.
    expect(body.match(/Savannah/g)).toHaveLength(3);
  });

  it("tells them what the application lets them do", () => {
    expect(body).toContain("upload documents, submit scholarship information");
    expect(body).toContain("strengths and challenges");
  });

  it("says what happens after the application", () => {
    expect(body).toContain("you will receive a notice to schedule your shadow day(s)");
  });

  it("is signed by a person", () => {
    expect(body.trimEnd().endsWith("Sincerely,\nNina Gaddy")).toBe(true);
  });
});

describe("the link", () => {
  /**
   * Twice on purpose — once mid-letter where the instruction is given, once at
   * the end where somebody who has read to the bottom is ready to act. Jimmy
   * wrote it both times.
   */
  it("appears twice", () => {
    expect(body.match(new RegExp(`href="${LINK.replace(/[?&]/g, "\\$&")}"`, "g"))).toHaveLength(2);
  });

  it("carries the wording that was asked for", () => {
    expect(body).toContain(
      "CLICK ON THIS LINK TO CREATE AN ACCOUNT IN OUR EDUCATIONAL PLATFORM, THE JAG"
    );
    expect(body).toContain(
      "CLICK THIS LINK TO CREATE YOUR JAG ACCOUNT AND COMPLETE YOUR ADMISSIONS APPLICATION"
    );
  });

  it("puts both inside anchors, not as bare text", () => {
    // Each CLICK phrase must run from inside an opening anchor to its close
    // with no tag in between — that is what makes it clickable rather than
    // shouty plain text next to a link.
    expect(body).toMatch(/<a href="[^"]+">CLICK ON THIS LINK[^<]*<\/a>/);
    expect(body).toMatch(/<a href="[^"]+">CLICK THIS LINK[^<]*<\/a>/);
    expect(body.split("<a href=").length - 1).toBe(2);
  });
});

describe("paragraphs", () => {
  /**
   * The sender converts newlines to <br> and escapes nothing, so a blank line
   * between paragraphs must be exactly one empty line — more produces visible
   * gaps, fewer runs the paragraphs together.
   */
  it("separates the three paragraphs and the sign-off with single blank lines", () => {
    expect(body).not.toContain("\n\n\n");
    const blocks = body.split("\n\n");
    expect(blocks).toHaveLength(4);
  });
});

describe("when a name is missing", () => {
  it("falls back to 'your child' rather than printing nothing", () => {
    const b = buildProspectInviteBody({ childName: "", signatory: "Nina Gaddy", inviteLink: LINK });
    expect(b).toContain("learn about your child's educational needs");
    expect(b).not.toContain("about 's");
  });

  /** Better an honest collective than a person who does not exist. */
  it("signs off as the admissions team when no contact is set", () => {
    const b = buildProspectInviteBody({ childName: "Savannah", signatory: "", inviteLink: LINK });
    expect(b.trimEnd().endsWith("Sincerely,\nThe Admissions Team")).toBe(true);
  });
});

describe("names are not a way to inject markup", () => {
  /**
   * Nothing here comes from a form — child and signatory are both read from our
   * own tables — but the body is interpolated into HTML that is never escaped,
   * so the one place a stray angle bracket could matter is guarded anyway.
   */
  it("strips angle brackets from a name", () => {
    const b = buildProspectInviteBody({
      childName: "<script>alert(1)</script>",
      signatory: "Nina <b>Gaddy</b>",
      inviteLink: LINK,
    });
    expect(b).not.toContain("<script>");
    expect(b).not.toContain("<b>");
    expect(b.split("<a href=").length - 1).toBe(2);
  });
});

/**
 * Where the link actually finishes.
 *
 * The letter says "create your JAG account and complete your admissions
 * application". The link it carries goes to /auth/callback, which recognises
 * type=invite and routes to /login/activate — and after the password is set,
 * activate redirects to whatever `next` says.
 *
 * `next` was never set, so `safeInternalPath(null, "/dashboard")` returned
 * /dashboard: a route gated on ACADEMYOS_ACCESS, which the PARENT_ACCESS group
 * does not grant. A family would have followed a link promising their child's
 * application, set a password, and been bounced off a staff screen.
 */
describe("where the parent lands afterwards", () => {
  it("finishes on the application portal, not the staff dashboard", () => {
    expect(PROSPECT_PORTAL_PATH).toBe("/apply/portal");
    expect(PROSPECT_PORTAL_PATH).not.toBe("/dashboard");
  });

  it("is a same-origin path, which is all the redirect guard accepts", () => {
    expect(PROSPECT_PORTAL_PATH.startsWith("/")).toBe(true);
    expect(PROSPECT_PORTAL_PATH.startsWith("//")).toBe(false);
    expect(PROSPECT_PORTAL_PATH).not.toMatch(/^https?:/);
  });
});
