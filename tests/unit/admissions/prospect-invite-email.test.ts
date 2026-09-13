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
  parentName: "Lana",
  childName: "Savannah",
  signatory: "Nina Gaddy",
  schoolName: "The Academy GA",
  inviteLink: LINK,
});

describe("the subject line", () => {
  it("is the one that was asked for", () => {
    expect(PROSPECT_INVITE_SUBJECT).toBe("Submit your application - The Academy");
  });
});

describe("the greeting", () => {
  /**
   * A letter that opens "Thank you for spending time with us" with no name in
   * front of it reads like a circular. The parent's own first name goes at the
   * top, on its own line.
   */
  it("opens with the parent's first name", () => {
    expect(body).toMatch(/^<div style="[^"]*">\n\s*<p style="[^"]*">Lana,<\/p>/);
  });

  it("greets the parent, not the child", () => {
    expect(body).not.toContain("Savannah,</p>");
  });

  /** Better no greeting than one addressed to a placeholder. */
  it("omits the greeting when there is no real name", () => {
    for (const parentName of ["", "   ", "Parent/Guardian", "parent/guardian"]) {
      const b = buildProspectInviteBody({
        parentName,
        childName: "Savannah",
        signatory: "Nina Gaddy",
        inviteLink: LINK,
      });
      expect(b).not.toMatch(/<p style="[^"]*">[^<]*,<\/p>/);
      expect(b).toContain("Thank you for spending time with us");
    }
  });

  it("still works when no parent name is passed at all", () => {
    const b = buildProspectInviteBody({
      childName: "Savannah",
      signatory: "Nina Gaddy",
      inviteLink: LINK,
    });
    expect(b).toContain("Thank you for spending time with us");
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

  it("is signed by a person, on the line under the sign-off", () => {
    expect(body).toContain("Sincerely,<br>Nina Gaddy");
  });

  /**
   * Four campuses share this letter. Without the campus under the signatory, a
   * family that enquired at more than one — or simply forgot which — has no way
   * to tell from the letter who wrote to them.
   */
  it("names the campus under the signatory", () => {
    expect(body).toContain("Sincerely,<br>Nina Gaddy<br>The Academy GA");
  });

  it("omits the campus line rather than leaving a blank one", () => {
    const b = buildProspectInviteBody({
      parentName: "Lana",
      childName: "Savannah",
      signatory: "Nina Gaddy",
      inviteLink: LINK,
    });
    expect(b).toContain("Sincerely,<br>Nina Gaddy</p>");
    expect(b).not.toContain("Nina Gaddy<br></p>");
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
    expect(body).toMatch(/<a href="[^"]+"[^>]*>CLICK ON THIS LINK[^<]*<\/a>/);
    expect(body).toMatch(/<a href="[^"]+"[^>]*>CLICK THIS LINK[^<]*<\/a>/);
    expect(body.split("<a href=").length - 1).toBe(2);
  });
});

describe("paragraphs", () => {
  /**
   * WHAT WENT WRONG, and why these assertions changed shape.
   *
   * This letter used to be plain text with blank lines between paragraphs, and
   * the test below used to assert exactly that. Both rested on a claim I wrote
   * into a comment without reading the sender: that newlines become <br>. From
   * providers/resend.ts:
   *
   *     if (/<[a-z][\s\S]*>/i.test(body)) return body;
   *
   * A body containing a tag is returned untouched, and this one contains
   * anchors. So every newline stayed a newline, HTML treats it as whitespace,
   * and the family received one unbroken wall of text. The tests passed the
   * whole time, because they were checking the string I built rather than the
   * markup that was sent.
   *
   * The layout is now explicit, so it is asserted as markup.
   */
  /** Greeting, the three paragraphs Jimmy wrote, and the sign-off. */
  it("sends five real paragraphs, not newline-separated text", () => {
    const paragraphs = body.match(/<p style="[^"]*">/g);
    expect(paragraphs).toHaveLength(5);
  });

  it("gives every paragraph a bottom margin, which is the gap itself", () => {
    const opens = [...body.matchAll(/<p style="([^"]*)">/g)];
    expect(opens).toHaveLength(5);
    for (const [, style] of opens) {
      expect(style).toContain("margin:0 0 16px");
    }
  });

  it("closes every paragraph it opens", () => {
    expect(body.split("<p ").length - 1).toBe(body.split("</p>").length - 1);
  });

  it("does not lean on newlines for layout", () => {
    // Strip the tags and the text must still be one run — proof that nothing
    // depends on whitespace surviving the trip through an email client.
    const withoutTags = body.replace(/<[^>]+>/g, "").trim();
    expect(withoutTags).not.toContain("\n\n");
  });

  it("wraps the letter so it stays readable on a phone", () => {
    expect(body).toMatch(/^<div style="[^"]*max-width:600px[^"]*">/);
    expect(body.trimEnd().endsWith("</div>")).toBe(true);
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
    expect(b).toContain("Sincerely,<br>The Admissions Team");
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
