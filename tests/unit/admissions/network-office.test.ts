import { describe, expect, it } from "vitest";

import {
  NETWORK_ESCALATION_EMAILS,
  NETWORK_OFFICE_EMAIL,
  NETWORK_SECOND_EMAIL,
  notifiesNetworkEscalation,
  notifiesNetworkOffice,
  withNetworkOffice,
} from "@/lib/admissions/communications/network-office";
import type { CommunicationTriggerEvent } from "@/lib/admissions/communications/types";

/**
 * A CHILD'S DETAILS MUST NOT LEAVE THE NETWORK'S OWN MAILBOXES.
 *
 * Until 28 September 2026 this module's default was jimmy.arispe@gmail.com.
 * ADMISSIONS_NETWORK_OFFICE_EMAIL was never set, so the default is what ran,
 * and two acceptance notifications went to a consumer mailbox carrying the
 * child's name, their campus, their parent's name and email, and a live link
 * to the record.
 *
 * Nothing was broken. The email was well-formed and went to the right people
 * plus one. It surfaced only because Jimmy noticed which of his own inboxes it
 * arrived in. That is why this is a test and not a comment.
 */

const NETWORK_DOMAINS = ["theacademyway.org", "theacademyga.org", "theacademyfl.org", "thejag.org"];

const CONSUMER_DOMAINS = [
  "gmail.com", "yahoo.com", "hotmail.com", "outlook.com",
  "aol.com", "icloud.com", "live.com", "msn.com",
];

function domainOf(email: string): string {
  return email.slice(email.lastIndexOf("@") + 1).toLowerCase();
}

describe("the network office address", () => {
  it("is not a consumer mailbox", () => {
    expect(CONSUMER_DOMAINS).not.toContain(domainOf(NETWORK_OFFICE_EMAIL));
  });

  it("is on one of the network's own domains", () => {
    expect(NETWORK_DOMAINS).toContain(domainOf(NETWORK_OFFICE_EMAIL));
  });

  it("is a single address, not a list somebody pasted in", () => {
    expect(NETWORK_OFFICE_EMAIL).not.toContain(",");
    expect(NETWORK_OFFICE_EMAIL.trim()).toBe(NETWORK_OFFICE_EMAIL);
    expect(NETWORK_OFFICE_EMAIL).toMatch(/^[^@\s]+@[^@\s]+\.[^@\s]+$/);
  });
});

describe("the second address", () => {
  // Same rule as above, for the same reason. A three-day-old inquiry carries
  // a child's name, their parent's name, email and telephone number, and what
  // the family wrote about their child's difficulties.
  it("is not a consumer mailbox", () => {
    expect(CONSUMER_DOMAINS).not.toContain(domainOf(NETWORK_SECOND_EMAIL));
  });

  it("is on one of the network's own domains", () => {
    expect(NETWORK_DOMAINS).toContain(domainOf(NETWORK_SECOND_EMAIL));
  });

  it("is a single address, not a list somebody pasted in", () => {
    expect(NETWORK_SECOND_EMAIL).not.toContain(",");
    expect(NETWORK_SECOND_EMAIL).toMatch(/^[^@\s]+@[^@\s]+\.[^@\s]+$/);
  });

  it("is both people, and not the same person twice", () => {
    expect(NETWORK_ESCALATION_EMAILS).toHaveLength(2);
    expect(new Set(NETWORK_ESCALATION_EMAILS.map((e) => e.toLowerCase())).size).toBe(2);
  });

  it("is reached by the three-day inquiry escalation and nothing else", () => {
    expect(notifiesNetworkEscalation("staff_interest_link_escalation" as never)).toBe(true);
    expect(notifiesNetworkEscalation("staff_new_inquiry" as never)).toBe(false);
    expect(notifiesNetworkEscalation("staff_application_accepted" as never)).toBe(false);
  });

  it("adds both to the campus list, de-duplicated", () => {
    const out = withNetworkOffice(
      "staff_interest_link_escalation" as never,
      ["nina.gaddy@theacademyga.org", NETWORK_OFFICE_EMAIL]
    );
    expect(out).toContain(NETWORK_SECOND_EMAIL);
    expect(out.filter((e) => e === NETWORK_OFFICE_EMAIL)).toHaveLength(1);
  });
});

describe("which events reach the network office", () => {
  it("includes an acceptance, which hands the family to the business office", () => {
    expect(notifiesNetworkOffice("staff_application_accepted" as CommunicationTriggerEvent)).toBe(true);
  });

  it("does not include an ordinary inquiry", () => {
    // Adding him to every campus contact row would have worked and would also
    // have sent him every inquiry, document upload and funding alert at four
    // schools. The list is the whole mechanism.
    expect(notifiesNetworkOffice("staff_new_inquiry" as CommunicationTriggerEvent)).toBe(false);
  });
});

describe("adding the network office to a campus list", () => {
  const accepted = "staff_application_accepted" as CommunicationTriggerEvent;

  it("appends it to the campus recipients", () => {
    const out = withNetworkOffice(accepted, ["nina.gaddy@theacademyga.org"]);
    expect(out).toEqual(["nina.gaddy@theacademyga.org", NETWORK_OFFICE_EMAIL]);
  });

  it("does not send a campus that already lists it two copies", () => {
    const out = withNetworkOffice(accepted, ["danni.treu@theacademyfl.org", NETWORK_OFFICE_EMAIL]);
    expect(out.filter((e) => e === NETWORK_OFFICE_EMAIL)).toHaveLength(1);
  });

  it("matches an existing entry regardless of case or padding", () => {
    const out = withNetworkOffice(accepted, [`  ${NETWORK_OFFICE_EMAIL.toUpperCase()}  `]);
    expect(out).toHaveLength(1);
  });

  it("leaves other events' recipient lists exactly as they were", () => {
    const campus = ["heather.brown@theacademyway.org"];
    expect(withNetworkOffice("staff_new_inquiry" as CommunicationTriggerEvent, campus)).toBe(campus);
  });

  it("still returns the address when the campus has no contacts at all", () => {
    // A campus with nobody listed must not swallow an acceptance.
    expect(withNetworkOffice(accepted, [])).toEqual([NETWORK_OFFICE_EMAIL]);
  });
});
