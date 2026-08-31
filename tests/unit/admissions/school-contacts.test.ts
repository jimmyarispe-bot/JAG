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
  publicInquiries: false,
};

const FULL: SchoolContactPatch = {
  contactName: "Vanessa Alvarado",
  contactEmail: "vanessa@theacademyway.org",
  bookingUrl: "https://calendar.google.com/calendar/appointments/schedules/AcZ123",
  publicInquiries: true,
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
