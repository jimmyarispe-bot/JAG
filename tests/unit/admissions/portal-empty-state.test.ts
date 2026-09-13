import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * What a parent is told when the portal has nothing to show them.
 *
 * On 12 September 2026 Lana Robinson followed her invitation, set a password,
 * landed on /apply/portal and was told "No inquiries found — submit an inquiry
 * using the same email as your account", with Submit Inquiry as the primary
 * button, pointing back at the interest form she had already filled in.
 *
 * She had an enquiry. Every read on that page was dying with 54001 stack depth
 * exceeded, because three RLS helper functions were SECURITY INVOKER and read
 * the tables whose policies called them (migration 350). The loader destructured
 * `data` and discarded `error` on all five reads, so a crash became `[]`, and
 * `[]` rendered as an empty list.
 *
 * Two separate faults, so two separate guards below: the loader must never again
 * discard an error, and a failed read must never again be dressed up as an empty
 * one.
 */

const root = join(__dirname, "..", "..", "..");
const queriesSrc = readFileSync(
  join(root, "src/lib/admissions/portal/queries.ts"),
  "utf8"
);
const listSrc = readFileSync(
  join(root, "src/components/admissions/portal/PortalLeadList.tsx"),
  "utf8"
);

/**
 * Source with comments removed.
 *
 * The comments in these files quote the old copy on purpose, so that anybody
 * reading them understands what was wrong with it. Asserting the old wording is
 * gone has to look at the code, not at the explanation of why it went.
 */
function code(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

const listCode = code(listSrc);

/** The body of getGuardianPortalLeads, isolated from the rest of the file. */
function guardianLoaderBody(): string {
  const start = queriesSrc.indexOf("export async function getGuardianPortalLeads");
  expect(start).toBeGreaterThan(-1);
  const after = queriesSrc.indexOf("\nexport async function", start + 10);
  return queriesSrc.slice(start, after === -1 ? undefined : after);
}

describe("the loader never discards an error", () => {
  /**
   * THE HOUSE FAILURE PATTERN, in its purest form:
   *
   *     const { data } = await supabase.from(...)   // error thrown away
   *     return data ?? []                           // a crash becomes nothing
   *
   * Every read must name `error`. This is a source check rather than a
   * behavioural one on purpose — the bug was a thing that was *absent* from the
   * code, and absence is what has to be asserted against.
   */
  it("destructures error from every supabase read", () => {
    const body = guardianLoaderBody();
    const destructurings = [...body.matchAll(/const \{([^}]*)\} = await supabase/g)];

    expect(destructurings.length).toBeGreaterThanOrEqual(4);
    for (const [, names] of destructurings) {
      expect(names).toContain("error");
    }
  });

  it("acts on each error rather than merely naming it", () => {
    const body = guardianLoaderBody();
    for (const name of [
      "guardianLinksError",
      "directLeadsError",
      "leadsError",
      "applicationsError",
    ]) {
      expect(body).toContain(`if (${name})`);
    }
  });

  /**
   * Guardian rows named leads, and not one of those leads came back. That is not
   * "no enquiries" — it is one policy disagreeing with another, which is exactly
   * the class of fault that caused this. It must report as a failure.
   */
  it("treats matched-but-unreadable leads as a failure, not an empty list", () => {
    const body = guardianLoaderBody();
    expect(body).toMatch(/if \(!leads\?\.length\)[\s\S]{0,400}ok: false/);
  });

  it("returns a result that forces the caller to handle both outcomes", () => {
    expect(queriesSrc).toContain("export type GuardianPortalResult");
    expect(queriesSrc).toMatch(/\{ ok: true; leads: GuardianPortalLead\[\] \}/);
    expect(queriesSrc).toMatch(/\{ ok: false; message: string \}/);
  });
});

describe("a failed read is not an empty one", () => {
  /**
   * THE ONE THAT MATTERS MOST.
   *
   * A family whose application we could not fetch must not be invited to fill it
   * in again. That produces a second lead for the same child, and admissions is
   * then holding two records with no way to tell which is real — a worse outcome
   * than the error itself.
   */
  it("offers no route back to the interest form when the read failed", () => {
    const start = listSrc.indexOf("if (loadError)");
    const end = listSrc.indexOf("if (leads.length === 0)");
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);

    const errorState = listSrc.slice(start, end);
    expect(errorState).not.toContain('href="/apply"');
    expect(errorState).toContain("Try again");
  });

  it("says what happened and promises nothing was lost", () => {
    expect(queriesSrc).toContain("Nothing you have submitted is lost.");
    expect(listSrc).toContain("We could not load your application");
  });
});

describe("when there really is nothing", () => {
  /** The old copy, which sent an invited parent back to square one. */
  it("no longer says 'No inquiries found' or offers Submit Inquiry", () => {
    expect(listCode).not.toContain("No inquiries found");
    expect(listCode).not.toContain("Submit Inquiry");
    expect(listCode).not.toContain("Submit an inquiry using the same email");
  });

  /**
   * The address is the whole diagnosis. If the enquiry is under a different
   * email, showing the one they are signed in as is what lets them — or the
   * admissions office — see it.
   */
  it("shows the family which address they are signed in as", () => {
    const start = listSrc.indexOf("if (leads.length === 0)");
    const emptyState = listSrc.slice(start, start + 1400);
    expect(emptyState).toContain("{userEmail}");
    expect(emptyState).toContain("different email");
  });

  /** Still reachable for a genuine walk-in, but not the loudest thing present. */
  it("keeps a quiet way to start a first enquiry", () => {
    const start = listSrc.indexOf("if (leads.length === 0)");
    const emptyState = listSrc.slice(start, start + 1400);
    expect(emptyState).toContain('href="/apply"');
    expect(emptyState).toContain("Start here");
    // Small, grey, and below the explanation — not a primary button.
    expect(emptyState).toMatch(/text-xs[^"]*text-slate-400[\s\S]{0,200}Start here/);
  });
});

describe("the page passes both facts down", () => {
  const pageSrc = readFileSync(join(root, "src/app/apply/portal/page.tsx"), "utf8");

  it("distinguishes the two outcomes rather than flattening them", () => {
    expect(pageSrc).toContain("result.ok ? result.leads : []");
    expect(pageSrc).toContain("result.ok ? null : result.message");
  });

  it("gives the list the signed-in address and the failure", () => {
    expect(pageSrc).toContain("userEmail={sessionUser.email}");
    expect(pageSrc).toContain("loadError={loadError}");
  });
});
