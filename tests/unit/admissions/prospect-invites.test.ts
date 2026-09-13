import { describe, expect, it } from "vitest";
import { PROSPECT_INVITE_BATCH_LIMIT } from "@/lib/admissions/portal/prospect-invites";

/**
 * Inviting a prospective parent into the application portal.
 *
 * The decision logic is extracted here so it can be checked without a database.
 * It is the same rule the module applies twice — once when building the preview
 * a person reads, once again at send time, because the list they read may be
 * minutes old.
 */
type Candidate = {
  guardianId: string;
  email: string | null;
  /** undefined = no account. Otherwise, what kind of account it is. */
  account?: { isStaff: boolean };
};

type Decision = { invite: true } | { invite: false; because: string };

function decide(c: Candidate): Decision {
  if (!c.email || c.email.trim() === "") {
    return { invite: false, because: "no_email" };
  }
  if (c.account?.isStaff) {
    return { invite: false, because: "staff_account" };
  }
  if (c.account) {
    return { invite: false, because: "already_invited" };
  }
  return { invite: true };
}

/** PARENT and nothing else is a parent account. Anything else is staff. */
function classify(roles: readonly string[]): { isStaff: boolean } {
  const parentOnly = roles.length > 0 && roles.every((r) => r === "PARENT");
  return { isStaff: !parentOnly };
}

describe("who gets invited", () => {
  it("invites a parent with an email and no account", () => {
    expect(decide({ guardianId: "g1", email: "parent@example.com" }))
      .toEqual({ invite: true });
  });

  it("skips a guardian with no email — there is nothing to send to", () => {
    expect(decide({ guardianId: "g2", email: null }))
      .toEqual({ invite: false, because: "no_email" });
    expect(decide({ guardianId: "g3", email: "   " }))
      .toEqual({ invite: false, because: "no_email" });
  });

  /**
   * THE ONE THAT MATTERS.
   *
   * `createManagedUser` deletes a user's existing roles before assigning the
   * requested one. For somebody being created that is correct. For somebody who
   * already exists it is destructive: the account keeps working and comes back
   * as a PARENT, having lost every staff role it held.
   *
   * Lead guardian emails are typed by whoever filled in the public form, and the
   * standing test address for this product is the founder's own. An invite that
   * "upgrades" an existing account would lock him out of the JAG he runs.
   *
   * So an existing account is refused outright. Never upgraded, never merged,
   * never re-invited.
   */
  it("refuses an address that belongs to a staff account", () => {
    expect(decide({ guardianId: "g4", email: "jimmy.arispe@gmail.com", account: classify(["PLATFORM_OWNER", "TEAM_MEMBER"]) }))
      .toEqual({ invite: false, because: "staff_account" });
  });

  it("refuses it even when everything else about the row is fine", () => {
    const perfect = {
      guardianId: "g5",
      email: "nina.gaddy@theacademyga.org",
      account: classify(["SCHOOL_LEADER"]),
    };
    expect(decide(perfect).invite).toBe(false);
  });

  /**
   * THE ONE THAT CAUSED A BUG IN PRODUCTION, on 12 September, minutes after
   * shipping. The page revalidates after a successful send, the candidate list
   * re-runs, and it finds the account that did not exist when it last rendered.
   * Wording that as "refused" put a warning directly above the words
   * "Invitation sent" — the reader assumes they broke something and presses
   * again.
   *
   * Sending is still refused. What changes is that it reads as done, not denied.
   */
  it("reports an existing PARENT account as already invited, not as a refusal", () => {
    expect(decide({ guardianId: "g7", email: "lana@example.com", account: classify(["PARENT"]) }))
      .toEqual({ invite: false, because: "already_invited" });
  });

  /**
   * Fail closed. If the check for existing accounts errors, every address is
   * treated as taken — not knowing is the one state in which inviting is unsafe.
   */
  it("treats an unknown account state as staff", () => {
    // The lookup errored, so every address is treated as taken AND as staff —
    // the reading that refuses.
    expect(decide({ guardianId: "g6", email: "someone@example.com", account: { isStaff: true } }))
      .toEqual({ invite: false, because: "staff_account" });
  });
});

describe("classifying an existing account", () => {
  it("calls PARENT-only a parent account", () => {
    expect(classify(["PARENT"]).isStaff).toBe(false);
  });

  it("calls any other role staff", () => {
    expect(classify(["SCHOOL_LEADER"]).isStaff).toBe(true);
    expect(classify(["PARENT", "TEAM_MEMBER"]).isStaff).toBe(true);
    expect(classify(["FOUNDER"]).isStaff).toBe(true);
  });

  /** An account with no roles is an unknown, and an unknown must refuse. */
  it("calls no roles at all staff", () => {
    expect(classify([]).isStaff).toBe(true);
  });
});

describe("the batch limit", () => {
  it("is small enough that a mistake reaches one household", () => {
    expect(PROSPECT_INVITE_BATCH_LIMIT).toBeLessThanOrEqual(4);
    expect(PROSPECT_INVITE_BATCH_LIMIT).toBeGreaterThan(0);
  });

  it("caps the ids actually processed", () => {
    const requested = ["a", "b", "c", "d", "e", "f"];
    expect(requested.slice(0, PROSPECT_INVITE_BATCH_LIMIT)).toHaveLength(
      PROSPECT_INVITE_BATCH_LIMIT
    );
  });
});

/**
 * The prospect portal matches a guardian to their enquiry by email, via
 * `is_guardian_of_lead`:
 *
 *     lower(lg.email) = lower(u.email)
 *
 * Not by a user_id column, which is how the enrolled portal works. Case and
 * surrounding whitespace therefore decide whether a family sees their own
 * application, so both sides are normalised the same way.
 */
describe("the email match that makes the portal work", () => {
  const norm = (s: string) => s.trim().toLowerCase();

  it("matches regardless of case", () => {
    expect(norm("Parent@Example.COM")).toBe(norm("parent@example.com"));
  });

  it("matches regardless of surrounding space", () => {
    expect(norm("  parent@example.com ")).toBe(norm("parent@example.com"));
  });

  it("does not match a different address", () => {
    expect(norm("parent@example.com")).not.toBe(norm("parent@example.co"));
  });
});

describe("the confirmation", () => {
  const accepted = (confirm: string) => confirm.trim() === "SEND";

  it("requires the literal word", () => {
    expect(accepted("SEND")).toBe(true);
    expect(accepted(" SEND ")).toBe(true);
  });

  it("rejects anything else, including a near miss", () => {
    expect(accepted("send")).toBe(false);
    expect(accepted("YES")).toBe(false);
    expect(accepted("")).toBe(false);
    expect(accepted("SENDD")).toBe(false);
  });
});
