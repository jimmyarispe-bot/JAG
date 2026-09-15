import { describe, expect, it } from "vitest";
import {
  describeOutcome,
  validateSchoolContact,
  type SchoolContactPatch,
} from "@/lib/admissions/school-contacts-shared";

const EMPTY: SchoolContactPatch = {
  contactName: null,
  contactEmail: null,
  bookingUrl: null,
  shadowDaysUrl: null,
  publicInquiries: false,
  fromEmail: null,
};

const FULL: SchoolContactPatch = {
  contactName: "Vanessa Alvarado",
  contactEmail: "vanessa@theacademyway.org",
  bookingUrl: "https://calendar.google.com/calendar/appointments/schedules/AcZ123",
  shadowDaysUrl: "https://calendar.app.google/AcZ456",
  publicInquiries: true,
  fromEmail: "admissions@theacademyga.org",
};

describe("validateSchoolContact", () => {
  it("accepts a fully configured school", () => {
    expect(validateSchoolContact(FULL)).toEqual([]);
  });

  it("accepts a school that is switched off and blank", () => {
    expect(validateSchoolContact(EMPTY)).toEqual([]);
  });

  it("rejects a booking link that is not https", () => {
    const issues = validateSchoolContact({
      ...FULL,
      bookingUrl: "calendar.google.com/calendar/appointments/schedules/AcZ123",
    });
    expect(issues.map((i) => i.field)).toContain("bookingUrl");
  });

  it("rejects http, because the link is mailed to a stranger", () => {
    const issues = validateSchoolContact({ ...FULL, bookingUrl: "http://example.com/book" });
    expect(issues.map((i) => i.field)).toContain("bookingUrl");
  });

  it("rejects something that is not an address", () => {
    const issues = validateSchoolContact({ ...FULL, contactEmail: "vanessa at the academy" });
    expect(issues.map((i) => i.field)).toContain("contactEmail");
  });

  /**
   * The combination that silently does nothing: a school families can choose,
   * with nobody to tell when one of them does.
   */
  it("warns when a school takes public inquiries with no contact email", () => {
    const issues = validateSchoolContact({ ...FULL, contactEmail: null });
    expect(issues.some((i) => i.field === "contactEmail")).toBe(true);
  });

  it("does not warn about a missing email on a school that is switched off", () => {
    const issues = validateSchoolContact({ ...EMPTY, contactName: "Someone" });
    expect(issues).toEqual([]);
  });
});

describe("describeOutcome", () => {
  it("says a hidden school cannot be chosen", () => {
    expect(describeOutcome({ ...FULL, publicInquiries: false })).toMatch(/Hidden/);
  });

  it("distinguishes no-link from fully configured", () => {
    const withLink = describeOutcome(FULL);
    const withoutLink = describeOutcome({ ...FULL, bookingUrl: null });
    expect(withLink).not.toBe(withoutLink);
    expect(withoutLink).toMatch(/in touch/);
  });

  it("calls out a link with nobody listening", () => {
    expect(describeOutcome({ ...FULL, contactEmail: null })).toMatch(/nobody is told/i);
  });
});

/**
 * The From address is the one field here that can stop mail entirely rather
 * than degrade it: Resend rejects a sender on a domain it has not verified.
 * Null is therefore the safe state, and the editor has to say so.
 */
describe("send-from address", () => {
  it("accepts a school's own address", () => {
    expect(validateSchoolContact(FULL)).toEqual([]);
  });

  it("rejects something that is not an address", () => {
    const issues = validateSchoolContact({ ...FULL, fromEmail: "theacademyga.org" });
    expect(issues.map((i) => i.field)).toContain("fromEmail");
  });

  it("treats blank as valid — it means fall back to the network default", () => {
    expect(validateSchoolContact({ ...FULL, fromEmail: null })).toEqual([]);
  });

  it("warns about the verification requirement, naming the domain", () => {
    const text = describeOutcome(FULL);
    expect(text).toContain("theacademyga.org");
    expect(text).toMatch(/verified in Resend/i);
  });

  it("says nothing about Resend when the school uses the default sender", () => {
    expect(describeOutcome({ ...FULL, fromEmail: null })).not.toMatch(/Resend/i);
  });
});

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * The second link.
 *
 * This card carried ONE field — "Google appointment schedule link" — writing
 * admissions_booking_url. shadow_days_url, which {{shadow_days_link}} merges
 * into when gate 2 invites a family, had no editor anywhere in the product and
 * could only be set by hand in SQL. Migrations 257 and 262 exist for exactly
 * that reason: each one is a person typing a link into the database because
 * there was nowhere else to put it.
 *
 * Both links were collected from every school leader. Only one had somewhere
 * to go.
 * ─────────────────────────────────────────────────────────────────────────────
 */
describe("the shadow day link", () => {
  it("is validated by the same rules as the interest call link", () => {
    for (const bad of ["calendar.app.google/AcZ456", "http://calendar.app.google/AcZ456"]) {
      const issues = validateSchoolContact({ ...FULL, shadowDaysUrl: bad });
      expect(issues.map((i) => i.field), bad).toContain("shadowDaysUrl");
    }
  });

  it("names the shadow day link, not the booking link, when the shadow one is wrong", () => {
    const issues = validateSchoolContact({ ...FULL, shadowDaysUrl: "http://x.test/y" });
    const message = issues.find((i) => i.field === "shadowDaysUrl")?.message ?? "";
    expect(message).toContain("shadow day link");
    expect(message).not.toContain("interest call link");
  });

  it("accepts a blank one — a school with no shadow days yet is legitimate", () => {
    expect(
      validateSchoolContact({ ...FULL, shadowDaysUrl: null }).map((i) => i.field)
    ).not.toContain("shadowDaysUrl");
  });

  /**
   * THE ONE THAT MATTERS. {{shadow_days_link}} resolves to `ctx.shadowDaysUrl ?? ""`
   * — an empty STRING, not an unresolved token — so a blank link mails a family
   * "You can book here: " with nothing after it, and migration 296's placeholder
   * audit cannot catch it because the field is known and merely empty. The only
   * place an operator can learn this is the editor.
   */
  it("warns in the outcome text when it is blank", () => {
    expect(describeOutcome({ ...FULL, shadowDaysUrl: null })).toContain("You can book here:");
  });

  it("says nothing about it once it is set", () => {
    expect(describeOutcome(FULL)).not.toContain("You can book here:");
  });

  /** A school hidden from the form sends nothing, so the warning would be noise. */
  it("stays quiet for a school that is switched off", () => {
    expect(describeOutcome(EMPTY)).not.toContain("You can book here:");
  });

  it("still reports the sender warning alongside it", () => {
    const text = describeOutcome({ ...FULL, shadowDaysUrl: null });
    expect(text).toContain("theacademyga.org");
    expect(text).toContain("You can book here:");
  });
});
